import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

export class UpdateAppearanceSettingsDto {
  @ApiProperty({
    enum: ['light', 'dark', 'vibrant', 'system'],
    description: "Thème de l'interface",
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark', 'vibrant', 'system'])
  theme?: 'light' | 'dark' | 'vibrant' | 'system'

  @ApiProperty({
    enum: ['fr', 'en', 'es', 'de'],
    description: "Langue de l'interface",
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['fr', 'en', 'es', 'de'])
  language?: string

  @ApiProperty({
    enum: ['small', 'medium', 'large'],
    description: 'Taille de la police',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['small', 'medium', 'large'])
  fontSize?: 'small' | 'medium' | 'large'

  @ApiProperty({
    enum: ['compact', 'normal', 'wide'],
    description: 'Largeur de la barre latérale',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['compact', 'normal', 'wide'])
  sidebarWidth?: 'compact' | 'normal' | 'wide'

  @ApiProperty({
    enum: ['compact', 'comfortable', 'spacious'],
    description: "Densité de l'interface",
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['compact', 'comfortable', 'spacious'])
  density?: 'compact' | 'comfortable' | 'spacious'

  @ApiProperty({
    enum: ['blue', 'green', 'purple', 'orange', 'pink', 'red'],
    description: "Couleur d'accent",
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['blue', 'green', 'purple', 'orange', 'pink', 'red'])
  accentColor?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red'

  @ApiProperty({
    enum: ['compact', 'full'],
    description: 'Largeur du contenu',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['compact', 'full'])
  contentWidth?: 'compact' | 'full'
}

export class GetAppearanceSettingsResponseDto {
  @ApiProperty({ enum: ['light', 'dark', 'vibrant', 'system'] })
  theme: 'light' | 'dark' | 'vibrant' | 'system'

  @ApiProperty({ enum: ['fr', 'en', 'es', 'de'] })
  language: string

  @ApiProperty({ enum: ['small', 'medium', 'large'] })
  fontSize: 'small' | 'medium' | 'large'

  @ApiProperty({ enum: ['compact', 'normal', 'wide'] })
  sidebarWidth: 'compact' | 'normal' | 'wide'

  @ApiProperty({ enum: ['compact', 'comfortable', 'spacious'] })
  density: 'compact' | 'comfortable' | 'spacious'

  @ApiProperty({ enum: ['blue', 'green', 'purple', 'orange', 'pink', 'red'] })
  accentColor: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red'

  @ApiProperty({ enum: ['compact', 'full'] })
  contentWidth: 'compact' | 'full'

  constructor(data: GetAppearanceSettingsResponseDto) {
    this.theme = data.theme
    this.language = data.language
    this.fontSize = data.fontSize
    this.sidebarWidth = data.sidebarWidth
    this.density = data.density
    this.accentColor = data.accentColor
    this.contentWidth = data.contentWidth
  }
}
