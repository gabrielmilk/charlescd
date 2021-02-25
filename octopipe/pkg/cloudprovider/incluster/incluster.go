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

package incluster

import (
	"k8s.io/client-go/rest"
	"octopipe/pkg/customerror"
)

type InCluster struct{}

func NewInCluster() *InCluster {
	return &InCluster{}
}

func (inCluster *InCluster) GetClient() (*rest.Config, error) {
	config, err := inCluster.getRestConfig()
	if err != nil {
		return nil, customerror.WithOperation(err, "incluster.GetClient.getRestConfig")
	}

	return config, nil
}

func (inCluster *InCluster) getRestConfig() (*rest.Config, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, customerror.New("", err.Error(), nil, "incluster.getClientKey.InClusterConfig")
	}
	return config, nil
}
