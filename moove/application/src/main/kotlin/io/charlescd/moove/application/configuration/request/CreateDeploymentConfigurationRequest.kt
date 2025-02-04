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

package io.charlescd.moove.application.configuration.request

import io.charlescd.moove.domain.DeploymentConfiguration
import io.charlescd.moove.domain.GitProviderEnum
import io.charlescd.moove.domain.User
import java.util.*
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull
import javax.validation.constraints.Pattern

data class CreateDeploymentConfigurationRequest(
    val name: String = "Deployment Configuration",

    @field:NotBlank
    @field:NotNull
    @field:Pattern(
        regexp = "^(?:http(s)?://)?[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=]+\$",
        message = "Butler URL must be a valid URL"
    )
    val butlerUrl: String,

    @field:NotBlank
    @field:NotNull
    val namespace: String,

    @field:NotBlank
    @field:NotNull
    val gitToken: String,

    @field:NotNull
    val gitProvider: GitProviderEnum
) {

    fun toDeploymentConfiguration(workspaceId: String, author: User) = DeploymentConfiguration(
        id = UUID.randomUUID().toString(),
        name = name,
        author = author,
        workspaceId = workspaceId,
        butlerUrl = butlerUrl,
        namespace = namespace,
        gitToken = gitToken,
        gitProvider = gitProvider
    )
}
