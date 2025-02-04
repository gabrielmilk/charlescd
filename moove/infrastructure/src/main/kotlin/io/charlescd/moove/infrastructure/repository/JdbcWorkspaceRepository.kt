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

package io.charlescd.moove.infrastructure.repository

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import io.charlescd.moove.domain.*
import io.charlescd.moove.domain.repository.WorkspaceRepository
import io.charlescd.moove.infrastructure.repository.mapper.SimpleWorkspaceExtractor
import io.charlescd.moove.infrastructure.repository.mapper.WorkspaceExtractor
import java.util.*
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository

@Repository
class JdbcWorkspaceRepository(
    private val jdbcTemplate: JdbcTemplate,
    private val workspaceExtractor: WorkspaceExtractor,
    private val simpleWorkspaceExtractor: SimpleWorkspaceExtractor
) : WorkspaceRepository {

    private val objectMapper =
        ObjectMapper().registerModule(JavaTimeModule()).disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)

    companion object {
        const val BASE_QUERY_STATEMENT = """
                SELECT workspaces.id                          AS workspace_id,
                       workspaces.name                        AS workspace_name,
                       workspaces.status                      AS workspace_status,
                       workspaces.created_at                  AS workspace_created_at,
                       workspaces.git_configuration_id        AS workspace_git_configuration_id,
                       workspaces.registry_configuration_id   AS workspace_registry_configuration_id,
                       workspaces.cd_configuration_id         AS workspace_cd_configuration_id,
                       workspaces.circle_matcher_url          AS workspace_circle_matcher_url,
                       workspaces.metric_configuration_id     AS workspace_metric_configuration_id,
                       workspaces.deployment_configuration_id AS workspace_deployment_configuration_id,
                       workspace_author.id                    AS workspace_author_id,
                       workspace_author.name                  AS workspace_author_name,
                       workspace_author.email                 AS workspace_author_email,
                       workspace_author.photo_url             AS workspace_author_photo_url,
                       workspace_author.created_at            AS workspace_author_created_at,
                       user_groups.id                         AS workspace_user_group_id,
                       user_groups.name                       AS workspace_user_group_name,
                       user_groups.created_at                 AS workspace_user_group_created_at,
                       user_group_author.id                   AS workspace_user_group_author_id,
                       user_group_author.name                 AS workspace_user_group_author_name,
                       user_group_author.email                AS workspace_user_group_author_email,
                       user_group_author.photo_url            AS workspace_user_group_author_photo_url,
                       user_group_author.created_at           AS workspace_user_group_author_created_at,
                       user_group_member.id                   AS workspace_user_group_member_id,
                       user_group_member.name                 AS workspace_user_group_member_name,
                       user_group_member.email                AS workspace_user_group_member_email,
                       user_group_member.photo_url            AS workspace_user_group_member_photo_url,
                       user_group_member.created_at           AS workspace_user_group_member_created_at
                FROM workspaces
                         INNER JOIN users workspace_author ON workspaces.user_id = workspace_author.id
                         LEFT JOIN workspaces_user_groups ON workspaces.id = workspaces_user_groups.workspace_id
                         LEFT JOIN user_groups ON workspaces_user_groups.user_group_id = user_groups.id
                         LEFT JOIN users user_group_author ON user_groups.user_id = user_group_author.id
                         LEFT JOIN user_groups_users on user_groups.id = user_groups_users.user_group_id
                         LEFT JOIN users user_group_member ON user_groups_users.user_id = user_group_member.id
                WHERE 1 = 1
            """

        const val BASE_COUNT_QUERY_STATEMENT = """
                SELECT count(*) AS total
                FROM workspaces 
                WHERE 1 = 1
                """
    }

    override fun save(workspace: Workspace): Workspace {
        createWorkspace(workspace)
        return find(workspace.id).get()
    }

    override fun find(id: String): Optional<Workspace> {
        return findWorkspaceById(id)
    }

    override fun find(pageRequest: PageRequest, name: String?): Page<SimpleWorkspace> {
        return findAllWorkspaces(pageRequest, name)
    }

    override fun update(workspace: Workspace): Workspace {
        updateWorkspace(workspace)
        return find(workspace.id).get()
    }

    override fun exists(id: String): Boolean {
        return checkIfWorkspaceExists(id)
    }

    override fun existsByName(name: String): Boolean {
        val countStatement = StringBuilder(BASE_COUNT_QUERY_STATEMENT)
            .appendln("AND workspaces.name= ?")
            .toString()
        return applyCountQuery(
            countStatement, arrayOf(name))
    }

    override fun associateUserGroupAndPermissions(workspaceId: String, userGroupId: String, permissions: List<Permission>) {
        createAssociation(workspaceId, userGroupId, permissions)
    }

    override fun disassociateUserGroupAndPermissions(workspaceId: String, userGroupId: String) {
        deleteAssociation(workspaceId, userGroupId)
    }

    private fun findAllWorkspaces(pageRequest: PageRequest, name: String?): Page<SimpleWorkspace> {
        val parameters = createParametersMap(name)

        val result = this.jdbcTemplate.query(
            createQueryStatement(parameters, pageRequest),
            parameters.values.toTypedArray(),
            simpleWorkspaceExtractor
        )

        return Page(
            result?.toList() ?: emptyList(),
            pageRequest.page,
            pageRequest.size,
            executeCountQuery(name) ?: 0)
    }

    private fun createQueryStatement(
        parameters: Map<String, String>,
        pageRequest: PageRequest
    ): String {
        val innerQueryStatement = createInnerQueryStatement(parameters)
        return """
            SELECT workspaces.id                          AS workspace_id,
                   workspaces.name                        AS workspace_name,
                   workspaces.status                      AS workspace_status,
                   workspaces.deployment_configuration_id AS workspace_deployment_configuration_id
            FROM workspaces WHERE 1 = 1 $innerQueryStatement
            ORDER BY workspaces.name, workspaces.id ASC
            LIMIT ${pageRequest.size}
            OFFSET ${pageRequest.offset()}
        """
    }

    private fun createInnerQueryStatement(
        parameters: Map<String, String>
    ): String {
        val innerQueryStatement = StringBuilder("")

        parameters.forEach { (k, _) -> appendParameter(k, innerQueryStatement) }

        return innerQueryStatement
            .toString()
    }

    private fun createParametersMap(
        name: String?
    ): Map<String, String> {
        val parameters = LinkedHashMap<String, String>()

        name?.apply {
            parameters["name"] = "%$this%"
        }

        return parameters
    }

    private fun createParametersArrayILikeQuery(param: String?): Array<Any> {
        val parameters = ArrayList<Any>()
        param?.let { parameters.add("%$param%") }
        return parameters.toTypedArray()
    }

    private fun appendParameter(parameter: String, query: StringBuilder) {
        when (parameter) {
            "name" -> query.appendln("AND workspaces.$parameter ILIKE ?")
        }
    }

    private fun executeCountQuery(name: String?): Int? {
        val statement = StringBuilder(BASE_COUNT_QUERY_STATEMENT)
        name?.let { statement.appendln("AND workspaces.name ILIKE ?") }
        return this.jdbcTemplate.queryForObject(
            statement.toString(),
            createParametersArrayILikeQuery(name)
        ) { resultSet, _ ->
            resultSet.getInt(1)
        }
    }

    private fun checkIfWorkspaceExists(id: String): Boolean {
        val countStatement = StringBuilder(BASE_COUNT_QUERY_STATEMENT)
            .appendln("AND workspaces.id = ?")
            .toString()
        return applyCountQuery(
            countStatement, arrayOf(id))
    }

    private fun applyCountQuery(statement: String, params: Array<String>): Boolean {
        val count = this.jdbcTemplate.queryForObject(
            statement,
            params
        ) { rs, _ -> rs.getInt(1) }
        return count != null && count >= 1
    }

    private fun updateWorkspace(workspace: Workspace) {
        val statement = """
                UPDATE workspaces
                SET name                          = ?,
                    status                        = ?,
                    git_configuration_id          = ?,
                    circle_matcher_url            = ?,
                    registry_configuration_id     = ?,
                    metric_configuration_id       = ?,
                    deployment_configuration_id   = ?
                WHERE id = ?
            """

        this.jdbcTemplate.update(
            statement,
            workspace.name,
            workspace.status.name,
            workspace.gitConfigurationId,
            workspace.circleMatcherUrl,
            workspace.registryConfigurationId,
            workspace.metricConfigurationId,
            workspace.deploymentConfigurationId,
            workspace.id
        )
    }

    private fun findWorkspaceById(id: String): Optional<Workspace> {
        val statement = StringBuilder(BASE_QUERY_STATEMENT)
            .appendln("AND workspaces.id = ?")
        return Optional.ofNullable(
            this.jdbcTemplate.query(statement.toString(), arrayOf(id), workspaceExtractor)?.firstOrNull()
        )
    }

    private fun createWorkspace(
        workspace: Workspace
    ) {
        val statement = "INSERT INTO workspaces(" +
                "id, " +
                "name, " +
                "user_id, " +
                "status, " +
                "circle_matcher_url, " +
                "created_At) " +
                "VALUES(?, ?, ?, ?, ?, ?)"

        this.jdbcTemplate.update(
            statement,
            workspace.id,
            workspace.name,
            workspace.author.id,
            workspace.status.name,
            workspace.circleMatcherUrl,
            workspace.createdAt
        )
    }

    private fun createAssociation(workspaceId: String, userGroupId: String, permissions: List<Permission>) {
        val statement =
            "INSERT INTO workspaces_user_groups(workspace_id, user_group_id, permissions) VALUES(?, ?, to_json(?::jsonb))"
        this.jdbcTemplate.update(
            statement,
            workspaceId,
            userGroupId,
            objectMapper.writeValueAsString(permissions)
        )
    }

    private fun deleteAssociation(workspaceId: String, userGroupId: String) {
        val statement = "DELETE FROM workspaces_user_groups WHERE workspace_id = ? AND user_group_id = ?"
        this.jdbcTemplate.update(
            statement,
            workspaceId,
            userGroupId
        )
    }
}
