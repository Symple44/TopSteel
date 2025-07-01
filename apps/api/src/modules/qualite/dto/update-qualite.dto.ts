import { PartialType } from "@nestjs/swagger";
import { CreateQualiteDto } from "./create-qualite.dto";

export class UpdateQualiteDto extends PartialType(CreateQualiteDto) {}
