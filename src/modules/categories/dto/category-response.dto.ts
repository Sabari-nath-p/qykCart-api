import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category, CategoryStatus } from '../entities/category.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { plainToClass } from 'class-transformer';

export class CategoryResponseDto {
    @ApiProperty({ description: 'Category ID' })
    id: string;

    @ApiProperty({ description: 'Category name' })
    name: string;

    @ApiProperty({ description: 'Category slug' })
    slug: string;

    @ApiPropertyOptional({ description: 'Category description' })
    description?: string;

    @ApiPropertyOptional({ description: 'Category image URL' })
    image?: string;

    @ApiPropertyOptional({ description: 'Parent category ID' })
    parentId?: string;

    @ApiPropertyOptional({
        description: 'Parent category details',
        type: () => CategoryResponseDto,
    })
    parent?: CategoryResponseDto;

    @ApiPropertyOptional({
        description: 'Child categories',
        type: () => [CategoryResponseDto],
    })
    children?: CategoryResponseDto[];

    @ApiProperty({
        enum: CategoryStatus,
        description: 'Category status',
    })
    status: CategoryStatus;

    @ApiProperty({ description: 'Sort order' })
    sortOrder: number;

    @ApiProperty({ description: 'Category created by user ID' })
    createdById: string;

    @ApiPropertyOptional({
        description: 'Category created by user details',
        type: () => UserResponseDto,
    })
    createdBy?: UserResponseDto;

    @ApiProperty({ description: 'Category creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Category last update timestamp' })
    updatedAt: Date;

    @ApiProperty({ description: 'Whether category is active' })
    get isActive(): boolean {
        return this.status === CategoryStatus.ACTIVE;
    }

    @ApiProperty({ description: 'Full path including parent hierarchy' })
    get fullPath(): string {
        if (this.parent) {
            return `${this.parent.name} > ${this.name}`;
        }
        return this.name;
    }

    constructor(category: Category) {
        this.id = category.id;
        this.name = category.name;
        this.slug = category.slug;
        this.description = category.description;
        this.image = category.image;
        this.parentId = category.parentId;
        this.status = category.status;
        this.sortOrder = category.sortOrder;
        this.createdById = category.createdById;
        this.createdAt = category.createdAt;
        this.updatedAt = category.updatedAt;

        // Include parent if loaded
        if (category.parent) {
            this.parent = new CategoryResponseDto(category.parent);
        }

        // Include children if loaded
        if (category.children && category.children.length > 0) {
            this.children = category.children.map(child => new CategoryResponseDto(child));
        }

        // Include created by user if loaded
        if (category.createdBy) {
            this.createdBy = plainToClass(UserResponseDto, category.createdBy);
        }
    }
}