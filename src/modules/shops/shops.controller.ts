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
    ApiQuery,
} from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { QueryShopsDto } from './dto/query-shops.dto';
import { ShopResponseDto } from './dto/shop-response.dto';
import { ShopStatus } from './entities/shop.entity';

@ApiTags('Shops')
@ApiBearerAuth('access-token')
@Controller('shops')
@UseInterceptors(ClassSerializerInterceptor)
export class ShopsController {
    constructor(private readonly shopsService: ShopsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new shop' })
    @ApiResponse({
        status: 201,
        description: 'Shop created successfully',
        type: ShopResponseDto,
    })
    @ApiResponse({ status: 409, description: 'Shop already exists' })
    @ApiResponse({ status: 403, description: 'Only shop owners can create shops' })
    async create(@Body() createShopDto: CreateShopDto) {
        return this.shopsService.create(createShopDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all shops with pagination and filtering' })
    @ApiResponse({
        status: 200,
        description: 'Shops retrieved successfully',
    })
    async findAll(@Query() queryDto: QueryShopsDto) {
        return this.shopsService.findAll(queryDto);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get shop statistics' })
    @ApiResponse({
        status: 200,
        description: 'Shop statistics retrieved successfully',
    })
    async getShopStats() {
        return this.shopsService.getShopStats();
    }

    @Get('active')
    @ApiOperation({ summary: 'Get all active shops' })
    @ApiResponse({
        status: 200,
        description: 'Active shops retrieved successfully',
        type: [ShopResponseDto],
    })
    async findActiveShops() {
        return this.shopsService.findActiveShops();
    }

    @Get('pending')
    @ApiOperation({ summary: 'Get all pending approval shops' })
    @ApiResponse({
        status: 200,
        description: 'Pending shops retrieved successfully',
        type: [ShopResponseDto],
    })
    async findPendingShops() {
        return this.shopsService.findPendingShops();
    }

    @Get('suspended')
    @ApiOperation({ summary: 'Get all suspended shops' })
    @ApiResponse({
        status: 200,
        description: 'Suspended shops retrieved successfully',
        type: [ShopResponseDto],
    })
    async findSuspendedShops() {
        return this.shopsService.findSuspendedShops();
    }

    @Get('with-delivery')
    @ApiOperation({ summary: 'Get all shops with delivery service' })
    @ApiResponse({
        status: 200,
        description: 'Shops with delivery retrieved successfully',
        type: [ShopResponseDto],
    })
    async findShopsWithDelivery() {
        return this.shopsService.findShopsWithDelivery();
    }

    @Get('currently-open')
    @ApiOperation({ summary: 'Get all currently open shops' })
    @ApiResponse({
        status: 200,
        description: 'Currently open shops retrieved successfully',
        type: [ShopResponseDto],
    })
    async findCurrentlyOpenShops() {
        return this.shopsService.findCurrentlyOpenShops();
    }

    @Get('nearby')
    @ApiOperation({ summary: 'Find nearby shops by location' })
    @ApiQuery({ name: 'lat', description: 'Latitude' })
    @ApiQuery({ name: 'lng', description: 'Longitude' })
    @ApiQuery({ name: 'radius', description: 'Search radius in kilometers', required: false })
    @ApiResponse({
        status: 200,
        description: 'Nearby shops retrieved successfully',
        type: [ShopResponseDto],
    })
    async findNearbyShops(
        @Query('lat') lat: number,
        @Query('lng') lng: number,
        @Query('radius') radius?: number,
    ) {
        return this.shopsService.findNearbyShops(lat, lng, radius);
    }

    @Get('by-city/:city')
    @ApiOperation({ summary: 'Get shops by city' })
    @ApiParam({ name: 'city', description: 'City name' })
    @ApiResponse({
        status: 200,
        description: 'Shops by city retrieved successfully',
        type: [ShopResponseDto],
    })
    async findShopsByCity(@Param('city') city: string) {
        return this.shopsService.findShopsByCity(city);
    }

    @Get('by-owner/:ownerId')
    @ApiOperation({ summary: 'Get shops by owner ID' })
    @ApiParam({ name: 'ownerId', description: 'Owner UUID' })
    @ApiResponse({
        status: 200,
        description: 'Shops by owner retrieved successfully',
        type: [ShopResponseDto],
    })
    async findShopsByOwner(@Param('ownerId', ParseUUIDPipe) ownerId: string) {
        return this.shopsService.findByOwner(ownerId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get shop by ID' })
    @ApiParam({ name: 'id', description: 'Shop UUID' })
    @ApiResponse({
        status: 200,
        description: 'Shop retrieved successfully',
        type: ShopResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Shop not found' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.shopsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update shop by ID' })
    @ApiParam({ name: 'id', description: 'Shop UUID' })
    @ApiResponse({
        status: 200,
        description: 'Shop updated successfully',
        type: ShopResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Shop not found' })
    @ApiResponse({ status: 409, description: 'Shop name already exists in city' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateShopDto: UpdateShopDto,
    ) {
        return this.shopsService.update(id, updateShopDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete shop by ID' })
    @ApiParam({ name: 'id', description: 'Shop UUID' })
    @ApiResponse({ status: 204, description: 'Shop deleted successfully' })
    @ApiResponse({ status: 404, description: 'Shop not found' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.shopsService.remove(id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update shop status' })
    @ApiParam({ name: 'id', description: 'Shop UUID' })
    @ApiResponse({
        status: 200,
        description: 'Shop status updated successfully',
        type: ShopResponseDto,
    })
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: ShopStatus,
    ) {
        return this.shopsService.updateStatus(id, status);
    }

    @Patch(':id/rating')
    @ApiOperation({ summary: 'Update shop rating' })
    @ApiParam({ name: 'id', description: 'Shop UUID' })
    @ApiResponse({
        status: 200,
        description: 'Shop rating updated successfully',
        type: ShopResponseDto,
    })
    async updateRating(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('rating') rating: number,
        @Body('reviewCount') reviewCount?: number,
    ) {
        return this.shopsService.updateRating(id, rating, reviewCount);
    }
}
