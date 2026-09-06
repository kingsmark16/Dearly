import { Module } from '@nestjs/common'
import { EmailDeliveryService } from './email-delivery.service.js'

@Module({
  providers: [EmailDeliveryService],
  exports: [EmailDeliveryService],
})
export class EmailModule {}
