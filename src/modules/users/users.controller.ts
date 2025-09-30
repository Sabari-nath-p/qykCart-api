import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole, UserStatus } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async findAll(@Query() queryDto: QueryUsersDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get('super-admins')
  @ApiOperation({ summary: 'Get all super admin users' })
  @ApiResponse({
    status: 200,
    description: 'Super admin users retrieved successfully',
    type: [UserResponseDto],
  })
  async findSuperAdmins() {
    return this.usersService.findSuperAdmins();
  }

  @Get('shop-owners')
  @ApiOperation({ summary: 'Get all shop owner users' })
  @ApiResponse({
    status: 200,
    description: 'Shop owner users retrieved successfully',
    type: [UserResponseDto],
  })
  async findShopOwners() {
    return this.usersService.findShopOwners();
  }

  @Get('regular-users')
  @ApiOperation({ summary: 'Get all regular users' })
  @ApiResponse({
    status: 200,
    description: 'Regular users retrieved successfully',
    type: [UserResponseDto],
  })
  async findRegularUsers() {
    return this.usersService.findRegularUsers();
  }

  @Get('delivery-partners')
  @ApiOperation({ summary: 'Get all delivery partner users' })
  @ApiResponse({
    status: 200,
    description: 'Delivery partner users retrieved successfully',
    type: [UserResponseDto],
  })
  async findDeliveryPartners() {
    return this.usersService.findDeliveryPartners();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active users' })
  @ApiResponse({
    status: 200,
    description: 'Active users retrieved successfully',
    type: [UserResponseDto],
  })
  async findActiveUsers() {
    return this.usersService.findActiveUsers();
  }

  @Get('inactive')
  @ApiOperation({ summary: 'Get all inactive users' })
  @ApiResponse({
    status: 200,
    description: 'Inactive users retrieved successfully',
    type: [UserResponseDto],
  })
  async findInactiveUsers() {
    return this.usersService.findInactiveUsers();
  }

  @Get('suspended')
  @ApiOperation({ summary: 'Get all suspended users' })
  @ApiResponse({
    status: 200,
    description: 'Suspended users retrieved successfully',
    type: [UserResponseDto],
  })
  async findSuspendedUsers() {
    return this.usersService.findSuspendedUsers();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending verification users' })
  @ApiResponse({
    status: 200,
    description: 'Pending users retrieved successfully',
    type: [UserResponseDto],
  })
  async findPendingUsers() {
    return this.usersService.findPendingUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or phone already in use' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    type: UserResponseDto,
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: UserStatus,
  ) {
    return this.usersService.updateStatus(id, status);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: UserResponseDto,
  })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('role') role: UserRole,
  ) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.changePassword(id, newPassword);
  }
}