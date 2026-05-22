import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { BrowserService } from './browser.service';
import { DarazService } from './daraz.service';
import { PriceOyeService } from './priceoye.service';
import { TelemartService } from './telemart.service';
import { OlxService } from './olx.service';
import { ApifyService } from './apify.service';
import { HistoryService } from './history.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductHistory } from './entities/product-history.entity';
import { PriceAlert } from './alerts/price-alert.entity';
import { AlertsModule } from './alerts/alerts.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 5,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.TYPEORM_HOST ?? 'localhost',
      port: parseInt(process.env.TYPEORM_PORT ?? '5432'),
      username: process.env.TYPEORM_USERNAME ?? 'postgres',
      password: process.env.TYPEORM_PASSWORD ?? 'postgres',
      database: process.env.TYPEORM_DATABASE ?? 'kartowl_db',
      entities: [ProductHistory, PriceAlert],
      synchronize: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([ProductHistory]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        if (redisHost) {
          const store = await import('cache-manager-redis-store');
          return {
            store: store.redisStore,
            host: redisHost,
            port: configService.get<number>('REDIS_PORT') || 6379,
            password: configService.get<string>('REDIS_PASSWORD'),
            username: configService.get<string>('REDIS_USERNAME'),
            no_ready_check: true,
            ttl: 3600,
          };
        }
        return {
          ttl: 3600000,
        };
      },
      inject: [ConfigService],
    }),
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [
    BrowserService,
    DarazService,
    PriceOyeService,
    TelemartService,
    OlxService,
    ApifyService,
    HistoryService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
