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

import React from 'react';
import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import { floatingIpStatus, transitionStatuses } from 'resources/floatingip';
import { FloatingIpStore } from 'stores/neutron/floatingIp';
import { Link } from 'react-router-dom';
import { emptyActionConfig } from 'utils/constants';
import { Col, Popover, Row } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import styles from './styles.less';
import actionConfigs from './actions';

@inject('rootStore')
@observer
export default class FloatingIps extends Base {
  init() {
    this.store = new FloatingIpStore();
    this.downloadStore = new FloatingIpStore();
  }

  get isFilterByBackend() {
    return true;
  }

  get isSortByBackend() {
    return true;
  }

  get defaultSortKey() {
    return 'status';
  }

  async getData({ silent, ...params } = {}) {
    if (this.isInDetailPage) {
      silent && (this.list.silent = true);
      const { detail: { addresses = [] } = {} } = this.props;
      const ips = [];
      // filter list by fixed_ip_address
      Object.keys(addresses).forEach((key) => {
        ips.push(
          ...addresses[key]
            .filter((item) => item['OS-EXT-IPS:type'] === 'fixed')
            .map((item) => item.addr)
        );
      });
      params.fixed_ip_address = ips;
      params.all_projects = this.isAdminPage;
      if (ips.length > 0) {
        await this.store.fetchListWithResourceName(params);
      } else {
        this.list.isLoading = false;
      }
    } else {
      super.getData({ silent, ...params });
    }
  }

  get fetchDataByCurrentProject() {
    // add project_id to fetch data;
    return true;
  }

  fetchDataByPage = async (params) => {
    await this.store.fetchListWithResourceName(params);
    this.list.silent = false;
  };

  get policy() {
    return 'get_floatingip';
  }

  get name() {
    return t('floating ips');
  }

  get isRecycleBinDetail() {
    const { pathname } = this.props.location;
    return pathname.indexOf('recycle-bin') >= 0;
  }

  get actionConfigs() {
    if (this.isRecycleBinDetail) {
      return emptyActionConfig;
    }
    if (this.isInDetailPage) {
      return this.isAdminPage
        ? actionConfigs.instanceDetailAdminConfigs
        : actionConfigs.instanceDetailConfigs;
    }
    return this.isAdminPage
      ? actionConfigs.adminConfigs
      : actionConfigs.actionConfigs;
  }

  get transitionStatusList() {
    return transitionStatuses;
  }

  get adminPageHasProjectFilter() {
    return true;
  }

  getColumns = () => [
    {
      title: t('ID/Floating IP'),
      dataIndex: 'floating_ip_address',
      isName: true,
      linkPrefix: `/network/${this.getUrl('floatingip')}/detail`,
    },
    {
      title: t('QoS Policy'),
      dataIndex: 'qos_policy_id',
      render: (value) => (
        <Link to={`/network/${this.getUrl('qos-policy')}/detail/${value}`}>
          {value}
        </Link>
      ),
    },
    {
      title: t('Project ID/Name'),
      dataIndex: 'project_name',
      hidden: !this.isAdminPage,
      sortKey: 'project_id',
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      render: (value) => value || '-',
      isHideable: true,
      sorter: false,
    },
    {
      title: t('Associated Resource'),
      dataIndex: 'resource_name',
      render: (resource_name, record) => {
        if (
          !resource_name &&
          record.port_forwardings &&
          record.port_forwardings.length !== 0
        ) {
          return (
            <>
              {t('{number} port forwarding rules', {
                number: record.port_forwardings.length,
              })}
              &nbsp;
              <Popover
                content={
                  <Row className={styles.popover_row} gutter={[8, 8]}>
                    {record.port_forwardings
                      .sort((a, b) => a.external_port - b.external_port)
                      .map((i) => (
                        <Col span={24}>
                          {`${record.floating_ip_address}:${i.external_port} => ${i.internal_ip_address}:${i.internal_port}`}
                        </Col>
                      ))}
                  </Row>
                }
                title={t('Port Forwarding')}
                destroyTooltipOnHide
              >
                <FileTextOutlined />
              </Popover>
            </>
          );
        }
        return resource_name || '';
      },
      isHideable: true,
      sorter: false,
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      render: (value) => floatingIpStatus[value] || '-',
    },
    {
      title: t('Created At'),
      dataIndex: 'created_at',
      valueRender: 'toLocalTime',
      isHideable: true,
      sorter: false,
    },
  ];

  get searchFilters() {
    const filters = [
      {
        label: t('Floating IP'),
        name: 'floating_ip_address',
      },
      {
        label: t('Status'),
        name: 'status',
        options: Object.keys(floatingIpStatus).map((key) => ({
          label: floatingIpStatus[key],
          key,
        })),
      },
    ];
    return filters;
  }
}