import { PartialType } from "@nestjs/swagger";
import { CreateTracabiliteDto } from "./create-tracabilite.dto";

export class UpdateTracabiliteDto extends PartialType(CreateTracabiliteDto) {}
