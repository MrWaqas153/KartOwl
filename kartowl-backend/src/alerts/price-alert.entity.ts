import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('price_alerts')
export class PriceAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  productUrl: string;

  @Column()
  productTitle: string;

  @Column('decimal')
  targetPrice: number;

  @Column('decimal', { nullable: true })
  currentPrice: number;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
