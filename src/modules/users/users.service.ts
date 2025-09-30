import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        ...(createUserDto.phone ? [{ phone: createUserDto.phone }] : []),
      ],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or phone already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(queryDto: QueryUsersDto): Promise<PaginatedUsers> {
    const { page = 1, limit = 10, search, role, status, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
    const skip = (page - 1) * limit;

    const whereCondition: FindOptionsWhere<User> = {};

    // Apply filters
    if (role) {
      whereCondition.role = role;
    }

    if (status) {
      whereCondition.status = status;
    }

    // Build query
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply where conditions
    if (Object.keys(whereCondition).length > 0) {
      queryBuilder.where(whereCondition);
    }

    // Apply search
    if (search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email or phone is being updated and doesn't conflict
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingUser = await this.findByPhone(updateUserDto.phone);
      if (existingUser) {
        throw new ConflictException('Phone already in use');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    return this.userRepository.save(user);
  }

  // Role-specific queries
  async findSuperAdmins(): Promise<User[]> {
    return this.userRepository.find({ where: { role: UserRole.SUPER_ADMIN } });
  }

  async findShopOwners(): Promise<User[]> {
    return this.userRepository.find({ where: { role: UserRole.SHOP_OWNER } });
  }

  async findRegularUsers(): Promise<User[]> {
    return this.userRepository.find({ where: { role: UserRole.USER } });
  }

  async findDeliveryPartners(): Promise<User[]> {
    return this.userRepository.find({ where: { role: UserRole.DELIVERY_PARTNER } });
  }

  // Status-specific queries
  async findActiveUsers(): Promise<User[]> {
    return this.userRepository.find({ where: { status: UserStatus.ACTIVE } });
  }

  async findInactiveUsers(): Promise<User[]> {
    return this.userRepository.find({ where: { status: UserStatus.INACTIVE } });
  }

  async findSuspendedUsers(): Promise<User[]> {
    return this.userRepository.find({ where: { status: UserStatus.SUSPENDED } });
  }

  async findPendingUsers(): Promise<User[]> {
    return this.userRepository.find({ where: { status: UserStatus.PENDING_VERIFICATION } });
  }

  // Statistics
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<UserRole, number>;
    byStatus: Record<UserStatus, number>;
  }> {
    const total = await this.userRepository.count();
    
    const byRole = {} as Record<UserRole, number>;
    const byStatus = {} as Record<UserStatus, number>;

    for (const role of Object.values(UserRole)) {
      byRole[role] = await this.userRepository.count({ where: { role } });
    }

    for (const status of Object.values(UserStatus)) {
      byStatus[status] = await this.userRepository.count({ where: { status } });
    }

    return { total, byRole, byStatus };
  }
}