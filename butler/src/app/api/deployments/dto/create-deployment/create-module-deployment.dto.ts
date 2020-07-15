/*
 * Copyright 2020 ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ModuleDeploymentEntity } from '../../entity'
import { CreateComponentDeploymentDto } from './create-component-deployment.dto'
import {
  IsDefined,
  IsNotEmpty,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import { ModuleEntity } from '../../../modules/entity'
import { ApiProperty } from '@nestjs/swagger'

export class CreateModuleDeploymentDto {

  @ApiProperty()
  @IsNotEmpty()
  public readonly moduleId!: string

  @ApiProperty()
  @IsNotEmpty()
  public readonly helmRepository!: string

  @ApiProperty({ type: () => [CreateComponentDeploymentDto] })
  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => CreateComponentDeploymentDto)
  public readonly components!: CreateComponentDeploymentDto[]

  @ApiProperty()
  public readonly gatewayName: string = ""

  @ApiProperty()
  public readonly hostValue: string = ""

  public toModuleDeploymentEntity(): ModuleDeploymentEntity {
    return new ModuleDeploymentEntity(
      this.moduleId,
      this.helmRepository,
      this.components.map(component => component.toComponentModuleEntity()),
      this.gatewayName,
      this.hostValue
    )
  }

  public toModuleEntity(): ModuleEntity {
    return new ModuleEntity(
      this.moduleId,
      this.components.map(component => component.toComponentEntity()),
    )
  }

}
