import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceAlert } from './price-alert.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([PriceAlert]),
  ],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule { }