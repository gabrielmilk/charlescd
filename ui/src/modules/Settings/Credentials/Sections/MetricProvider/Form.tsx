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

import React, { useState, useEffect } from 'react';
import useForm from 'core/hooks/useForm';
import Button from 'core/components/Button';
import { Option } from 'core/components/Form/Select/interfaces';
import Text from 'core/components/Text';
import { CHARLES_DOC } from 'core/components/Popover';
import { Datasource, Plugin, PluginDatasource } from './interfaces';
import { serializePlugins } from './helpers';
import { Props } from '../interfaces';
import { useDatasource, usePlugins } from './hooks';
import Styled from './styled';
import { find, map } from 'lodash';
import { testDataSourceConnection } from 'core/providers/datasources';
import { useTestConnection } from 'core/hooks/useTestConnection';
import ConnectionStatus from 'core/components/ConnectionStatus';
import DocumentationLink from 'core/components/DocumentationLink';

const datasourcePlaceholder = 'charlescd-data-source-example';

const FormMetricProvider = ({ onFinish }: Props<Datasource>) => {
  const { responseSave, save, loadingSave, loadingAdd } = useDatasource();
  const {
    response: testConnectionResponse,
    loading: loadingConnectionResponse,
    save: testConnection
  } = useTestConnection(testDataSourceConnection);
  const [showPlaceholder, setShowPlaceholder] = useState<boolean>(true);
  const [plugin, setPlugin] = useState<Plugin>();
  const { response: plugins, getAll } = usePlugins();
  const { 
    control,
    register,
    handleSubmit,
    getValues,
    formState,
    watch
  } = useForm<Datasource>({ 
        mode: 'onChange',
        defaultValues: {
          data: {
            url: 'https://'
          }
        }
      });
  
  const urlField = watch('data.url') as string;

  useEffect(() => {
    setShowPlaceholder(['https://', 'http://'].includes(urlField));
  }, [urlField]);

  useEffect(() => {
    getAll();
    if (responseSave) onFinish();
  }, [onFinish, responseSave, getAll]);

  const onSubmit = (datasource: Datasource) => {
    save({
      ...datasource,
      pluginSrc: plugin.src
    });
  };

  const onChange = (option: Option) => {
    setPlugin(find(plugins as Plugin[], { id: option['value'] }));
  };

  const handleTestConnection = () => {
    const { data } = getValues();

    testConnection({
      pluginSrc: plugin.src,
      data
    });
  };

  const renderFields = () => (
    <>
      <Styled.Input
        ref={register({ required: true })}
        name="name"
        label="Datasource name"
      />
      {map(
        (plugin.inputParameters as PluginDatasource)['configurationInputs'],
        input => (
          <Styled.Wrapper key={input.name}>
            <Styled.Input
              ref={register({ required: input.required })}
              name={`data.${input.name}`}
              label={input.label}
            />
            {(input.name === 'url' && showPlaceholder) &&
              <Styled.Placeholder color="light">
                {datasourcePlaceholder}
              </Styled.Placeholder>
            }
          </Styled.Wrapper>
        )
      )}
      <ConnectionStatus
        successMessage="Successful connection with the metrics provider."
        errorMessage={testConnectionResponse?.message}
        status={testConnectionResponse?.status}
      />
      <Styled.TestConnectionButton
        id="test-connection"
        type="button"
        onClick={handleTestConnection}
        isLoading={loadingConnectionResponse}
        isDisabled={!formState.isValid}
      >
        Test connection
      </Styled.TestConnectionButton>
    </>
  );

  const renderSelect = () => (
    <Styled.Select
      control={control}
      name="url"
      label="Select a datasource plugin"
      options={serializePlugins(plugins as Plugin[])}
      onChange={option => onChange(option)}
    />
  );

  const renderForm = () => (
    <Styled.Form onSubmit={handleSubmit(onSubmit)}>
      {renderSelect()}
      {plugin && renderFields()}
      <div>
        <Button.Default
          type="submit"
          isLoading={loadingSave || loadingAdd}
          isDisabled={!formState.isValid}
        >
          Save
        </Button.Default>
      </div>
    </Styled.Form>
  );

  return (
    <Styled.Content>
      <Text.h2 color="light">Add Datasource</Text.h2>
      <Text.h4 color="dark" data-testid="text-datasource">
        Adding the URL of our tool helps Charles to do metrics generation since
        this can vary from workspace to another. See our{' '}
        <DocumentationLink
          text="documentation"
          documentationLink={`${CHARLES_DOC}/reference/metrics`}
        />
        for further details.
      </Text.h4>
      {renderForm()}
    </Styled.Content>
  );
};

export default FormMetricProvider;
