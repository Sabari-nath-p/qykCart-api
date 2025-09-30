import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CategoryStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('categories')
@Index(['name'], { unique: true })
@Index(['slug'], { unique: true })
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    image: string;

    @Column({
        type: 'enum',
        enum: CategoryStatus,
        default: CategoryStatus.ACTIVE,
    })
    status: CategoryStatus;

    @Column({ default: 0 })
    sortOrder: number;

    // Hierarchical categories (parent-child relationship)
    @ManyToOne(() => Category, category => category.children, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent: Category;

    @Column({ name: 'parentId', nullable: true })
    parentId: string;

    @OneToMany(() => Category, category => category.parent)
    children: Category[];

    // Creator (Super Admin only)
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @Column({ name: 'createdById' })
    createdById: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual fields
    get isActive(): boolean {
        return this.status === CategoryStatus.ACTIVE;
    }

    get fullPath(): string {
        if (this.parent) {
            return `${this.parent.name} > ${this.name}`;
        }
        return this.name;
    }
}