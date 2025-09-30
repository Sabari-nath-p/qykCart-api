import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category, CategoryStatus } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        private readonly usersService: UsersService,
    ) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        // Verify the creator is a super admin
        const creator = await this.usersService.findOne(createCategoryDto.createdById);
        if (!creator.isSuperAdmin) {
            throw new ForbiddenException('Only super admins can create categories');
        }

        // Check if category name or slug already exists
        const existingCategory = await this.categoryRepository.findOne({
            where: [
                { name: createCategoryDto.name },
                { slug: createCategoryDto.slug },
            ],
        });

        if (existingCategory) {
            throw new ConflictException(
                'Category with this name or slug already exists',
            );
        }

        // Verify parent category exists if provided
        if (createCategoryDto.parentId) {
            const parentCategory = await this.findOne(createCategoryDto.parentId);
            if (!parentCategory) {
                throw new NotFoundException('Parent category not found');
            }
        }

        const category = this.categoryRepository.create(createCategoryDto);
        return this.categoryRepository.save(category);
    }

    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find({
            relations: ['parent', 'children', 'createdBy'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findActive(): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { status: CategoryStatus.ACTIVE },
            relations: ['parent', 'children', 'createdBy'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findRootCategories(): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { parentId: IsNull(), status: CategoryStatus.ACTIVE },
            relations: ['children', 'createdBy'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findByParent(parentId: string): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { parentId, status: CategoryStatus.ACTIVE },
            relations: ['children', 'createdBy'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['parent', 'children', 'createdBy'],
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
    }

    async findBySlug(slug: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { slug },
            relations: ['parent', 'children', 'createdBy'],
        });

        if (!category) {
            throw new NotFoundException(`Category with slug ${slug} not found`);
        }

        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);

        // Check for name or slug conflicts if they're being updated
        if (updateCategoryDto.name || updateCategoryDto.slug) {
            const existingCategory = await this.categoryRepository.findOne({
                where: [
                    ...(updateCategoryDto.name ? [{ name: updateCategoryDto.name }] : []),
                    ...(updateCategoryDto.slug ? [{ slug: updateCategoryDto.slug }] : []),
                ],
            });

            if (existingCategory && existingCategory.id !== id) {
                throw new ConflictException(
                    'Category with this name or slug already exists',
                );
            }
        }

        // Verify parent category exists if being updated
        if (updateCategoryDto.parentId) {
            const parentCategory = await this.findOne(updateCategoryDto.parentId);
            if (!parentCategory) {
                throw new NotFoundException('Parent category not found');
            }

            // Prevent circular reference
            if (updateCategoryDto.parentId === id) {
                throw new ConflictException('Category cannot be its own parent');
            }
        }

        Object.assign(category, updateCategoryDto);
        return this.categoryRepository.save(category);
    }

    async remove(id: string): Promise<void> {
        const category = await this.findOne(id);

        // Check if category has children
        const childrenCount = await this.categoryRepository.count({
            where: { parentId: id },
        });

        if (childrenCount > 0) {
            throw new ConflictException(
                'Cannot delete category that has child categories',
            );
        }

        await this.categoryRepository.remove(category);
    }

    async updateStatus(id: string, status: CategoryStatus): Promise<Category> {
        const category = await this.findOne(id);
        category.status = status;
        return this.categoryRepository.save(category);
    }

    async getCategoryHierarchy(): Promise<Category[]> {
        const rootCategories = await this.categoryRepository.find({
            where: { parentId: IsNull() },
            relations: ['children', 'createdBy'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });

        // Recursively load all children
        for (const category of rootCategories) {
            await this.loadChildrenRecursively(category);
        }

        return rootCategories;
    }

    private async loadChildrenRecursively(category: Category): Promise<void> {
        if (category.children && category.children.length > 0) {
            for (const child of category.children) {
                await this.loadChildrenRecursively(child);
            }
        }
    }

    async getCategoryStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        rootCategories: number;
        byStatus: Record<CategoryStatus, number>;
    }> {
        const total = await this.categoryRepository.count();
        const active = await this.categoryRepository.count({
            where: { status: CategoryStatus.ACTIVE },
        });
        const inactive = await this.categoryRepository.count({
            where: { status: CategoryStatus.INACTIVE },
        });
        const rootCategories = await this.categoryRepository.count({
            where: { parentId: IsNull() },
        });

        const byStatus = {} as Record<CategoryStatus, number>;
        for (const status of Object.values(CategoryStatus)) {
            byStatus[status] = await this.categoryRepository.count({ where: { status } });
        }

        return { total, active, inactive, rootCategories, byStatus };
    }
}
