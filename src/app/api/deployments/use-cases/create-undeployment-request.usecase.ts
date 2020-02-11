import {
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'
import {
  CreateUndeploymentDto,
  ReadUndeploymentDto
} from '../dto'
import { InjectRepository } from '@nestjs/typeorm'
import {
  ComponentDeploymentEntity,
  ComponentUndeploymentEntity,
  DeploymentEntity,
  QueuedUndeploymentEntity,
  UndeploymentEntity
} from '../entity'
import { Repository } from 'typeorm'
import { QueuedPipelineStatusEnum } from '../enums'
import {
  PipelineDeploymentsService,
  PipelineErrorHandlingService,
  PipelineQueuesService
} from '../services'
import { ComponentEntity } from '../../components/entity'

@Injectable()
export class CreateUndeploymentRequestUsecase {

  constructor(
    @InjectRepository(DeploymentEntity)
    private readonly deploymentsRepository: Repository<DeploymentEntity>,
    @InjectRepository(UndeploymentEntity)
    private readonly undeploymentsRepository: Repository<UndeploymentEntity>,
    @InjectRepository(ComponentEntity)
    private readonly componentsRepository: Repository<ComponentEntity>,
    @InjectRepository(QueuedUndeploymentEntity)
    private readonly queuedUndeploymentsRepository: Repository<QueuedUndeploymentEntity>,
    private readonly pipelineQueuesService: PipelineQueuesService,
    private readonly pipelineDeploymentsService: PipelineDeploymentsService,
    private readonly pipelineErrorHandlingService: PipelineErrorHandlingService,
  ) {}

  public async execute(createUndeploymentDto: CreateUndeploymentDto, deploymentId: string): Promise<ReadUndeploymentDto> {
    let undeployment: UndeploymentEntity

    try {
      undeployment = await this.persistUndeploymentRequest(createUndeploymentDto, deploymentId)
      await this.scheduleComponentUndeployments(undeployment)
      return undeployment.toReadDto()
    } catch (error) {
      this.pipelineErrorHandlingService.handleUndeploymentFailure(undeployment)
      throw error
    }
  }

  private async persistUndeploymentRequest(
      createUndeploymentDto: CreateUndeploymentDto,
      deploymentId: string
  ): Promise<UndeploymentEntity> {

    try {
      const deployment: DeploymentEntity = await this.deploymentsRepository.findOne({
        where: { id: deploymentId },
        relations: ['modules', 'modules.components']
      })
      return await this.undeploymentsRepository.save(createUndeploymentDto.toEntity(deployment))
    } catch (error) {
      throw new InternalServerErrorException('Could not save undeployment')
    }
  }

  private async scheduleComponentUndeployments(undeployment: UndeploymentEntity): Promise<void> {
    try {
      const componentUndeployments: ComponentUndeploymentEntity[] = undeployment.getComponentUndeployments()
      await Promise.all(
          componentUndeployments.map(
              componentUndeployment => this.enqueueComponentUndeployment(undeployment, componentUndeployment)
          )
      )
    } catch (error) {
      throw error
    }
  }

  private async enqueueComponentUndeployment(
      undeployment: UndeploymentEntity,
      componentUndeployment: ComponentUndeploymentEntity
  ): Promise<void> {

    let queuedUndeployment: QueuedUndeploymentEntity

    try {
      queuedUndeployment = await this.persistQueuedUndeployment(componentUndeployment.componentDeployment, componentUndeployment)
      const component: ComponentEntity =
          await this.componentsRepository.findOne({ id: componentUndeployment.componentDeployment.componentId })

      if (queuedUndeployment.status === QueuedPipelineStatusEnum.RUNNING) {
        await this.pipelineDeploymentsService.triggerUndeployment(
            componentUndeployment.componentDeployment, component,
            undeployment.deployment, queuedUndeployment
        )
      }
    } catch (error) {
      throw error
    }
  }

  private async persistQueuedUndeployment(
      componentDeployment: ComponentDeploymentEntity,
      componentUndeployment: ComponentUndeploymentEntity
  ): Promise<QueuedUndeploymentEntity> {

    try {
      const status: QueuedPipelineStatusEnum =
          await this.pipelineQueuesService.getQueuedPipelineStatus(componentDeployment.componentId)

      return await this.queuedUndeploymentsRepository.save(
          new QueuedUndeploymentEntity(componentDeployment.componentId, componentDeployment.id, status, componentUndeployment.id)
      )
    } catch (error) {
      throw new InternalServerErrorException('Could not save queued undeployment')
    }
  }
}
