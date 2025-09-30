import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryStatus } from './entities/category.entity';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new category (Super Admin only)' })
    @ApiResponse({
        status: 201,
        description: 'Category created successfully',
        type: CategoryResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 403, description: 'Only super admins can create categories' })
    @ApiResponse({ status: 409, description: 'Category with this name or slug already exists' })
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
        const category = await this.categoriesService.create(createCategoryDto);
        return new CategoryResponseDto(category);
    }

    @Get()
    @ApiOperation({ summary: 'Get all categories with optional filtering' })
    @ApiResponse({
        status: 200,
        description: 'Categories retrieved successfully',
        type: [CategoryResponseDto],
    })
    @ApiQuery({ name: 'status', enum: CategoryStatus, required: false })
    @ApiQuery({ name: 'parentId', type: 'string', required: false })
    @ApiQuery({ name: 'rootOnly', type: 'boolean', required: false })
    @ApiQuery({ name: 'activeOnly', type: 'boolean', required: false })
    async findAll(@Query() query: QueryCategoriesDto): Promise<CategoryResponseDto[]> {
        let categories;

        if (query.activeOnly) {
            categories = await this.categoriesService.findActive();
        } else if (query.rootOnly) {
            categories = await this.categoriesService.findRootCategories();
        } else if (query.parentId) {
            categories = await this.categoriesService.findByParent(query.parentId);
        } else {
            categories = await this.categoriesService.findAll();
        }

        // Filter by status if provided
        if (query.status) {
            categories = categories.filter(category => category.status === query.status);
        }

        return categories.map(category => new CategoryResponseDto(category));
    }

    @Get('hierarchy')
    @ApiOperation({ summary: 'Get complete category hierarchy tree' })
    @ApiResponse({
        status: 200,
        description: 'Category hierarchy retrieved successfully',
        type: [CategoryResponseDto],
    })
    async getCategoryHierarchy(): Promise<CategoryResponseDto[]> {
        const categories = await this.categoriesService.getCategoryHierarchy();
        return categories.map(category => new CategoryResponseDto(category));
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get category statistics' })
    @ApiResponse({
        status: 200,
        description: 'Category statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number' },
                active: { type: 'number' },
                inactive: { type: 'number' },
                rootCategories: { type: 'number' },
                byStatus: {
                    type: 'object',
                    properties: {
                        [CategoryStatus.ACTIVE]: { type: 'number' },
                        [CategoryStatus.INACTIVE]: { type: 'number' },
                    },
                },
            },
        },
    })
    async getCategoryStats() {
        return this.categoriesService.getCategoryStats();
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get category by slug' })
    @ApiResponse({
        status: 200,
        description: 'Category retrieved successfully',
        type: CategoryResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiParam({ name: 'slug', description: 'Category slug' })
    async findBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
        const category = await this.categoriesService.findBySlug(slug);
        return new CategoryResponseDto(category);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get category by ID' })
    @ApiResponse({
        status: 200,
        description: 'Category retrieved successfully',
        type: CategoryResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
        const category = await this.categoriesService.findOne(id);
        return new CategoryResponseDto(category);
    }

    @Get(':id/children')
    @ApiOperation({ summary: 'Get child categories of a specific category' })
    @ApiResponse({
        status: 200,
        description: 'Child categories retrieved successfully',
        type: [CategoryResponseDto],
    })
    @ApiResponse({ status: 404, description: 'Parent category not found' })
    @ApiParam({ name: 'id', description: 'Parent category ID' })
    async getChildren(@Param('id') id: string): Promise<CategoryResponseDto[]> {
        const categories = await this.categoriesService.findByParent(id);
        return categories.map(category => new CategoryResponseDto(category));
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update category' })
    @ApiResponse({
        status: 200,
        description: 'Category updated successfully',
        type: CategoryResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiResponse({ status: 409, description: 'Category with this name or slug already exists' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<CategoryResponseDto> {
        const category = await this.categoriesService.update(id, updateCategoryDto);
        return new CategoryResponseDto(category);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update category status' })
    @ApiResponse({
        status: 200,
        description: 'Category status updated successfully',
        type: CategoryResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: CategoryStatus,
    ): Promise<CategoryResponseDto> {
        const category = await this.categoriesService.updateStatus(id, status);
        return new CategoryResponseDto(category);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete category' })
    @ApiResponse({ status: 200, description: 'Category deleted successfully' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiResponse({ status: 409, description: 'Cannot delete category that has child categories' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    async remove(@Param('id') id: string): Promise<{ message: string }> {
        await this.categoriesService.remove(id);
        return { message: 'Category deleted successfully' };
    }
}
