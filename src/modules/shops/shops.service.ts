import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Shop, ShopStatus, WorkingDay } from './entities/shop.entity';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { QueryShopsDto } from './dto/query-shops.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

export interface PaginatedShops {
    data: Shop[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class ShopsService {
    constructor(
        @InjectRepository(Shop)
        private readonly shopRepository: Repository<Shop>,
        private readonly usersService: UsersService,
    ) { }

    async create(createShopDto: CreateShopDto): Promise<Shop> {
        // Verify the owner exists and is a shop owner
        const owner = await this.usersService.findOne(createShopDto.ownerId);
        if (!owner.isShopOwner && !owner.isSuperAdmin) {
            throw new ForbiddenException('Only shop owners can create shops');
        }

        // Check if shop name already exists in the same city
        const existingShop = await this.shopRepository.findOne({
            where: {
                shopName: createShopDto.shopName,
                city: createShopDto.city,
            },
        });

        if (existingShop) {
            throw new ConflictException(
                'Shop with this name already exists in the same city',
            );
        }

        // Validate opening and closing times
        if (createShopDto.openingTime >= createShopDto.closingTime) {
            throw new BadRequestException(
                'Opening time must be before closing time',
            );
        }

        const shop = this.shopRepository.create(createShopDto);
        return this.shopRepository.save(shop);
    }

    async findAll(queryDto: QueryShopsDto): Promise<PaginatedShops> {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            city,
            state,
            district,
            zipCode,
            hasOwnDeliveryPartner,
            isDeliveryAvailable,
            minRating,
            workingDay,
            isCurrentlyOpen,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            lat,
            lng,
            radius = 10,
        } = queryDto;

        const skip = (page - 1) * limit;

        const queryBuilder = this.shopRepository.createQueryBuilder('shop')
            .leftJoinAndSelect('shop.owner', 'owner');

        // Apply filters
        if (status) {
            queryBuilder.andWhere('shop.status = :status', { status });
        }

        if (city) {
            queryBuilder.andWhere('shop.city LIKE :city', { city: `%${city}%` });
        }

        if (state) {
            queryBuilder.andWhere('shop.state LIKE :state', { state: `%${state}%` });
        }

        if (district) {
            queryBuilder.andWhere('shop.district LIKE :district', { district: `%${district}%` });
        }

        if (zipCode) {
            queryBuilder.andWhere('shop.zipCode = :zipCode', { zipCode });
        }

        if (hasOwnDeliveryPartner !== undefined) {
            queryBuilder.andWhere('shop.hasOwnDeliveryPartner = :hasOwnDeliveryPartner', {
                hasOwnDeliveryPartner,
            });
        }

        if (isDeliveryAvailable !== undefined) {
            queryBuilder.andWhere('shop.isDeliveryAvailable = :isDeliveryAvailable', {
                isDeliveryAvailable,
            });
        }

        if (minRating !== undefined) {
            queryBuilder.andWhere('shop.rating >= :minRating', { minRating });
        }

        if (workingDay) {
            queryBuilder.andWhere('shop.workingDays LIKE :workingDay', {
                workingDay: `%${workingDay}%`,
            });
        }

        // Search functionality
        if (search) {
            queryBuilder.andWhere(
                '(shop.shopName LIKE :search OR shop.city LIKE :search OR shop.district LIKE :search OR shop.description LIKE :search)',
                { search: `%${search}%` },
            );
        }

        // Location-based search
        if (lat && lng) {
            queryBuilder.andWhere(
                `(6371 * acos(cos(radians(:lat)) * cos(radians(shop.latitude)) * 
         cos(radians(shop.longitude) - radians(:lng)) + 
         sin(radians(:lat)) * sin(radians(shop.latitude)))) <= :radius`,
                { lat, lng, radius },
            );
        }

        // Currently open filter
        if (isCurrentlyOpen) {
            const now = new Date();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDay = dayNames[now.getDay()];
            const currentTime = now.toTimeString().slice(0, 5);

            queryBuilder
                .andWhere('shop.status = :activeStatus', { activeStatus: ShopStatus.ACTIVE })
                .andWhere('shop.workingDays LIKE :currentDay', { currentDay: `%${currentDay}%` })
                .andWhere('shop.openingTime <= :currentTime', { currentTime })
                .andWhere('shop.closingTime >= :currentTime', { currentTime });
        }

        // Apply sorting
        queryBuilder.orderBy(`shop.${sortBy}`, sortOrder);

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

    async findOne(id: string): Promise<Shop> {
        const shop = await this.shopRepository.findOne({
            where: { id },
            relations: ['owner'],
        });

        if (!shop) {
            throw new NotFoundException(`Shop with ID ${id} not found`);
        }

        return shop;
    }

    async findByOwner(ownerId: string): Promise<Shop[]> {
        return this.shopRepository.find({
            where: { ownerId },
            relations: ['owner'],
        });
    }

    async update(id: string, updateShopDto: UpdateShopDto): Promise<Shop> {
        const shop = await this.findOne(id);

        // Validate opening and closing times if provided
        const openingTime = updateShopDto.openingTime || shop.openingTime;
        const closingTime = updateShopDto.closingTime || shop.closingTime;

        if (openingTime >= closingTime) {
            throw new BadRequestException(
                'Opening time must be before closing time',
            );
        }

        // Check for shop name conflict if name is being changed
        if (updateShopDto.shopName && updateShopDto.shopName !== shop.shopName) {
            const existingShop = await this.shopRepository.findOne({
                where: {
                    shopName: updateShopDto.shopName,
                    city: updateShopDto.city || shop.city,
                },
            });

            if (existingShop && existingShop.id !== id) {
                throw new ConflictException(
                    'Shop with this name already exists in the same city',
                );
            }
        }

        Object.assign(shop, updateShopDto);
        return this.shopRepository.save(shop);
    }

    async remove(id: string): Promise<void> {
        const shop = await this.findOne(id);
        await this.shopRepository.remove(shop);
    }

    async updateStatus(id: string, status: ShopStatus): Promise<Shop> {
        const shop = await this.findOne(id);
        shop.status = status;
        return this.shopRepository.save(shop);
    }

    async updateRating(id: string, rating: number, reviewCount?: number): Promise<Shop> {
        const shop = await this.findOne(id);

        if (reviewCount !== undefined) {
            // Calculate new average rating
            const totalRating = shop.rating * shop.totalReviews + rating;
            shop.totalReviews += 1;
            shop.rating = totalRating / shop.totalReviews;
        } else {
            shop.rating = rating;
        }

        return this.shopRepository.save(shop);
    }

    // Status-specific queries
    async findActiveShops(): Promise<Shop[]> {
        return this.shopRepository.find({
            where: { status: ShopStatus.ACTIVE },
            relations: ['owner'],
        });
    }

    async findPendingShops(): Promise<Shop[]> {
        return this.shopRepository.find({
            where: { status: ShopStatus.PENDING_APPROVAL },
            relations: ['owner'],
        });
    }

    async findSuspendedShops(): Promise<Shop[]> {
        return this.shopRepository.find({
            where: { status: ShopStatus.SUSPENDED },
            relations: ['owner'],
        });
    }

    // Location-based queries
    async findNearbyShops(lat: number, lng: number, radius: number = 10): Promise<Shop[]> {
        return this.shopRepository
            .createQueryBuilder('shop')
            .leftJoinAndSelect('shop.owner', 'owner')
            .where(
                `(6371 * acos(cos(radians(:lat)) * cos(radians(shop.latitude)) * 
         cos(radians(shop.longitude) - radians(:lng)) + 
         sin(radians(:lat)) * sin(radians(shop.latitude)))) <= :radius`,
                { lat, lng, radius },
            )
            .andWhere('shop.status = :status', { status: ShopStatus.ACTIVE })
            .getMany();
    }

    async findShopsByCity(city: string): Promise<Shop[]> {
        return this.shopRepository.find({
            where: { city: Like(`%${city}%`), status: ShopStatus.ACTIVE },
            relations: ['owner'],
        });
    }

    async findShopsWithDelivery(): Promise<Shop[]> {
        return this.shopRepository.find({
            where: {
                isDeliveryAvailable: true,
                status: ShopStatus.ACTIVE
            },
            relations: ['owner'],
        });
    }

    async findCurrentlyOpenShops(): Promise<Shop[]> {
        const now = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = dayNames[now.getDay()];
        const currentTime = now.toTimeString().slice(0, 5);

        return this.shopRepository
            .createQueryBuilder('shop')
            .leftJoinAndSelect('shop.owner', 'owner')
            .where('shop.status = :status', { status: ShopStatus.ACTIVE })
            .andWhere('shop.workingDays LIKE :currentDay', { currentDay: `%${currentDay}%` })
            .andWhere('shop.openingTime <= :currentTime', { currentTime })
            .andWhere('shop.closingTime >= :currentTime', { currentTime })
            .getMany();
    }

    // Statistics
    async getShopStats(): Promise<{
        total: number;
        byStatus: Record<ShopStatus, number>;
        byCity: Record<string, number>;
        withDelivery: number;
        currentlyOpen: number;
    }> {
        const total = await this.shopRepository.count();

        const byStatus = {} as Record<ShopStatus, number>;
        for (const status of Object.values(ShopStatus)) {
            byStatus[status] = await this.shopRepository.count({ where: { status } });
        }

        const withDelivery = await this.shopRepository.count({
            where: { isDeliveryAvailable: true },
        });

        const currentlyOpen = (await this.findCurrentlyOpenShops()).length;

        // Get top cities
        const cityStats = await this.shopRepository
            .createQueryBuilder('shop')
            .select('shop.city', 'city')
            .addSelect('COUNT(*)', 'count')
            .groupBy('shop.city')
            .orderBy('count', 'DESC')
            .limit(10)
            .getRawMany();

        const byCity = cityStats.reduce((acc, stat) => {
            acc[stat.city] = parseInt(stat.count);
            return acc;
        }, {});

        return { total, byStatus, byCity, withDelivery, currentlyOpen };
    }
}
