import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ProductHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productTitle: string;

  @Column()
  marketplace: string; // 'daraz', 'priceoye', etc.

  @Column('int')
  price: number;

  @Column('int', { nullable: true })
  originalPrice: number; // Original price before discount (nullable for items without discount)

  @Column('int', { nullable: true, default: 0 })
  discount: number; // Discount percentage (0-100)

  @Column()
  productUrl: string; // Unique identifier basically

  @Column({ nullable: true })
  imageUrl: string; // Store image URL for trending display

  @CreateDateColumn()
  scrapedAt: Date;
}
