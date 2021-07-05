// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalIronicStore from 'stores/ironic/ironic';
import { powerState, provisioningState } from 'resources/ironic';
import { ironicOriginEndpoint } from 'client/client/constants';
import actionConfigs from './actions';

@inject('rootStore')
@observer
export default class BareMetalNode extends Base {
  init() {
    this.store = globalIronicStore;
  }

  get policy() {
    return 'baremetal:node:get';
  }

  get name() {
    return t('bare metal nodes');
  }

  get rowKey() {
    return 'uuid';
  }

  get checkEndpoint() {
    return true;
  }

  get endpoint() {
    return ironicOriginEndpoint();
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('Node ID/Name'),
      dataIndex: 'name',
      idKey: 'uuid',
      linkPrefix: '/compute/baremetal-node-admin/detail',
    },
    {
      title: t('Ironic Instance Name'),
      dataIndex: 'instance_info',
      render: (value) => {
        const { display_name = '' } = value || {};
        return display_name || '-';
      },
    },
    {
      title: t('Power State'),
      dataIndex: 'power_state',
      render: (value) => powerState[value] || value,
    },
    {
      title: t('Provision State'),
      dataIndex: 'provision_state',
      render: (value) => provisioningState[value] || value,
    },
    {
      title: t('Maintained'),
      dataIndex: 'maintenance',
      valueRender: 'yesNo',
      tip: (value, record) => record.maintenance_reason,
    },
    {
      title: t('Number Of Ports'),
      dataIndex: 'portCount',
      isHideable: true,
    },
    {
      title: t('Driver'),
      dataIndex: 'driver',
      isHideable: true,
    },
    {
      title: t('Created At'),
      dataIndex: 'created_at',
      isHideable: true,
      valueRender: 'sinceTime',
    },
  ];

  get searchFilters() {
    return [];
  }

  updateFetchParams = (params) => {
    const { all_projects, ...rest } = params;
    return rest;
  };
}