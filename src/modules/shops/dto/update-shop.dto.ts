import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateShopDto } from './create-shop.dto';

export class UpdateShopDto extends PartialType(
    OmitType(CreateShopDto, ['ownerId'] as const),
) { }