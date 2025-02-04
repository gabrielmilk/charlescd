/*
 *
 *  * Copyright 2020 ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
 *  *
 *  * Licensed under the Apache License, Version 2.0 (the "License");
 *  * you may not use this file except in compliance with the License.
 *  * You may obtain a copy of the License at
 *  *
 *  *     http://www.apache.org/licenses/LICENSE-2.0
 *  *
 *  * Unless required by applicable law or agreed to in writing, software
 *  * distributed under the License is distributed on an "AS IS" BASIS,
 *  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  * See the License for the specific language governing permissions and
 *  * limitations under the License.
 *
 */

package io.charlescd.moove.domain.repository

import io.charlescd.moove.domain.*
import java.time.Duration
import java.util.*

interface CircleRepository {

    fun save(circle: Circle): Circle

    fun update(circle: Circle): Circle

    fun delete(id: String)

    fun findById(id: String): Optional<Circle>

    fun findByIdAndWorkspaceId(id: String, workspaceId: String): Optional<Circle>

    fun find(name: String?, active: Boolean?, workspaceId: String, pageRequest: PageRequest): Page<Circle>

    fun find(name: String?, except: String?, workspaceId: String, pageRequest: PageRequest): Page<SimpleCircle>

    fun findDefaultByWorkspaceId(workspaceId: String): Optional<Circle>

    fun countGroupedByStatus(workspaceId: String): List<CircleCount>

    fun countGroupedByStatus(workspaceId: String, name: String?): List<CircleCount>

    fun getNotDefaultCirclesAverageLifeTime(workspaceId: String): Duration

    fun findCirclesHistory(workspaceId: String, name: String?, pageRequest: PageRequest): Page<CircleHistory>

    fun count(workspaceId: String): Int

    fun count(workspaceId: String, name: String?): Int

    fun findByWorkspaceId(workspaceId: String): Circles

    fun countPercentageByWorkspaceId(workspaceId: String): Int

    fun findCirclesPercentage(workspaceId: String, name: String?, active: Boolean, pageRequest: PageRequest?): Page<Circle>

    fun existsByNameAndWorkspaceId(name: String, workspaceId: String): Boolean
}
