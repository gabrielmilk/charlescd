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

import React from 'react';
import MutationObserver from 'mutation-observer'
import { render, wait, fireEvent } from 'unit-test/testUtils';
import CreateUser from '..';

(global as any).MutationObserver = MutationObserver

const props = {
  onFinish: jest.fn()
};

test('render CreateUser default component', async () => {
  const { getByTestId } = render(
    <CreateUser {...props} onFinish={props.onFinish}/>
  );

  expect(getByTestId('create-user')).toBeInTheDocument();
});

test('close CreateUser component', async () => {
    const { queryByTestId, getByTestId } = render(
      <CreateUser {...props} onFinish={props.onFinish}/>
    );

    const createUser = getByTestId('create-user');
    expect(createUser).toBeInTheDocument();

    const tabPanelCloseButton = queryByTestId('icon-cancel');
    expect(tabPanelCloseButton).toBeInTheDocument();

    fireEvent.click(tabPanelCloseButton);
    expect(createUser).not.toBeInTheDocument();
});

test("render CreateUser Form component", async () => {
  const { getByTestId } = render(
    <CreateUser {...props} onFinish={props.onFinish} />
  );

  expect(getByTestId("create-user")).toBeInTheDocument();

  const ContentCreateUser = getByTestId("content-create-user");
  expect(ContentCreateUser).toBeInTheDocument();

  const FormCreateUser = getByTestId("form-create-user");
  expect(FormCreateUser).toBeInTheDocument();

  const ButtonCreateUser = getByTestId("button-create-user");
  expect(ButtonCreateUser).toBeInTheDocument();

  const InputName = getByTestId("input-text-name");
  expect(InputName).toBeEmpty();
});