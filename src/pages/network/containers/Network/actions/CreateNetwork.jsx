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

import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import { nameTypeValidate, ipValidate } from 'utils/validate';
import globalNetworkStore from 'stores/neutron/network';
import globalProjectStore from 'stores/keystone/project';
import { isEmpty, isFunction } from 'lodash';
import Notify from 'components/Notify';
import checkPolicy from 'resources/policy';
import globalNeutronStore from 'stores/neutron/neutron';
import networkUtil from './networkUtil';

const {
  physicalNetworkArray,
  segmentationNetworkArray,
  segmentationNetworkRequireArray,
  checkAllocation_pools,
  checkIpv6Allocation_pools,
  checkDNS,
  checkIpv6DNS,
  checkHostRoutes,
  checkIpv6HostRoutes,
  getAllocationPools,
  getHostRouters,
} = networkUtil;

const { isIpCidr, isIPv6Cidr, isIpv6 } = ipValidate;

const { nameValidateWithoutChinese } = nameTypeValidate;

@inject('rootStore')
@observer
export default class CreateNetwork extends ModalAction {
  static id = 'create-network';

  static title = t('Create Network');

  get name() {
    return t('create network');
  }

  init() {
    globalNeutronStore.fetchAvailableZones();
    this.isAdminPage && globalProjectStore.fetchList();
  }

  get isSystemAdmin() {
    return checkPolicy({
      rules: ['skyline:system_admin'],
      every: false,
    });
  }

  get defaultValue() {
    const { user: { project: { id } = {} } = {} } = this.props.rootStore;
    return {
      project_id: id,
      enable_dhcp: true,
      provider_network_type: 'vxlan',
      ip_version: 'ipv4',
      disable_gateway: false,
      more: false,
    };
  }

  onSubmit = (values) => {
    const {
      // admin_state_up,
      name,
      project_id,
      provider_network_type,
      provider_physical_network,
      provider_segmentation_id,
      shared,
      external_network,
      availableZone,
      allocation_pools,
      host_routes,
      description,
      mtu,
      ...rest
    } = values;

    const allocationPools = getAllocationPools(allocation_pools);

    const hostRouters = getHostRouters(host_routes);

    const networkCommonData = {
      name,
      description,
      availability_zone_hints: [availableZone],
      mtu,
    };

    const networkAdminPageData = {
      'router:external': external_network,
      project_id,
      'provider:network_type': provider_network_type,
      'provider:physical_network': provider_physical_network,
      'provider:segmentation_id': provider_segmentation_id,
    };
    const networkSystemAdminData = {
      shared,
    };
    let fetchData = { ...networkCommonData };
    if (this.isAdminPage) {
      fetchData = { ...fetchData, ...networkAdminPageData };
    }
    if (this.isSystemAdmin) {
      fetchData = { ...fetchData, ...networkSystemAdminData };
    }
    return globalNetworkStore.createAndMore(fetchData, {
      ...rest,
      allocation_pools: allocationPools,
      host_routes: hostRouters,
    });
  };

  onOk = (values, containerProps, callback) => {
    // eslint-disable-next-line no-console
    console.log('onOk', values);
    this.values = values;
    return this.onSubmit(values, containerProps).then(
      () => {
        !this.isModal && this.routing.push(this.listUrl);
        Notify.success(this.successText);
        if (callback && isFunction(callback)) {
          callback(true, false);
        }
      },
      (err) => {
        const { type, error } = JSON.parse(err);
        if (type === 'create_network') {
          Notify.errorWithDetail(error, this.errorText);
        } else if (type === 'create_subnet') {
          Notify.errorWithDetail(
            error,
            t('Unable to {action}, instance: {name}.', {
              action: t('Create Subnet'),
              name: values.subnet_name,
            })
          );
        }
        // eslint-disable-next-line no-console
        console.log(error);
        if (callback && isFunction(callback)) {
          callback(false, true);
        }
      }
    );
  };

  get availableZones() {
    return (globalNeutronStore.availableZones || [])
      .filter((it) => it.state === 'available' && it.resource === 'network')
      .map((it) => ({
        value: it.name,
        label: it.name,
      }));
  }

  static policy = ['create_network', 'create_subnet'];

  static allowed = () => Promise.resolve(true);

  get SegIDTips() {
    const { provider_network_type = 'vxlan' } = this.state;
    switch (provider_network_type) {
      case 'vxlan':
        return t(
          'For VXLAN networks, valid segmentation IDs are 1 to 16777215'
        );
      case 'vlan':
        return t('For VLAN networks, valid segmentation IDs are 1 to 4094');
      case 'gre':
        return t(
          'For GRE networks, valid segmentation IDs are 1 to 4294967295'
        );
      default:
        return t(
          'For VXLAN networks, valid segmentation IDs are 1 to 16777215'
        );
    }
  }

  get SegMax() {
    const { provider_network_type = 'vxlan' } = this.state;
    switch (provider_network_type) {
      case 'vxlan':
        return 16777215;
      case 'vlan':
        return 4094;
      case 'gre':
        return 4294967295;
      default:
        return 16777215;
    }
  }

  checkCidr = (value) => {
    if (isEmpty(value)) return false;

    const { ip_version = 'ipv4' } = this.state;

    if (ip_version === 'ipv4' && !isIpCidr(value)) return false;

    if (ip_version === 'ipv6' && !isIPv6Cidr(value)) return false;

    return true;
  };

  checkGateway = (value) => {
    if (isEmpty(value)) return true;

    if (!isIpv6(value)) return false;

    return true;
  };

  get formItems() {
    const {
      more,
      create_subnet = false,
      provider_network_type = 'vxlan',
      ip_version = 'ipv4',
      disable_gateway = false,
    } = this.state;
    const projectOptions = globalProjectStore.list.data.map((project) => ({
      label: project.name,
      value: project.id,
    }));

    const hiddenPhysicalNetwork =
      this.isAdminPage &&
      physicalNetworkArray.indexOf(provider_network_type) > -1;
    const requirePhysicalNetwork =
      this.isAdminPage &&
      physicalNetworkArray.indexOf(provider_network_type) > -1;
    const hiddenSegmentation =
      this.isAdminPage &&
      segmentationNetworkArray.indexOf(provider_network_type) > -1;
    const requireSegmentation =
      this.isAdminPage &&
      segmentationNetworkRequireArray.indexOf(provider_network_type) > -1;
    const isIpv4 = ip_version === 'ipv4';

    return [
      {
        name: 'name',
        label: t('Network Name'),
        type: 'input-name',
        required: true,
        withoutChinese: true,
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
        required: false,
      },
      {
        name: 'availableZone',
        label: t('Available Zone'),
        type: 'select',
        placeholder: t('Please select'),
        required: true,
        options: this.availableZones,
      },
      {
        name: 'mtu',
        label: t('MTU'),
        type: 'input-number',
        min: 68,
        max: 9000,
        extra: t('Minimum value is 68 for IPv4, and 1280 for IPv6.'),
      },
      {
        name: 'create_subnet',
        label: t('Create Subnet'),
        type: 'check',
        onChange: (e) => {
          this.setState({
            create_subnet: e,
          });
        },
      },
      {
        name: 'shared',
        label: t('Shared'),
        type: 'check',
        hidden: !this.isSystemAdmin,
      },
      // {
      //   name: 'admin_state_up',
      //   label: t('Enable Admin State'),
      //   type: 'check',
      //   onChange: (e) => {
      //     this.setState({
      //       enable_admin_state: e,
      //     });
      //   },
      //   tip: t('If checked, the network will be enable.'),
      //   hidden: !isAdmin,
      // },
      {
        name: 'external_network',
        label: t('External Network'),
        type: 'check',
        hidden: !this.isAdminPage,
      },
      {
        name: 'project_id',
        label: t('Project'),
        type: 'select',
        showSearch: true,
        hidden: !this.isAdminPage,
        required: this.isAdminPage,
        options: projectOptions,
      },
      {
        name: 'provider_network_type',
        label: t('Provider Network Type'),
        type: 'select',
        hidden: !this.isAdminPage,
        required: this.isAdminPage,
        options: [
          { label: 'vxlan', value: 'vxlan' },
          { label: 'flat', value: 'flat' },
          { label: 'vlan', value: 'vlan' },
          { label: 'gre', value: 'gre' },
        ],
        onChange: (e) => {
          this.setState({
            provider_network_type: e,
          });
        },
      },
      {
        name: 'provider_physical_network',
        label: t('Provider Physical Network'),
        type: 'input',
        hidden: !hiddenPhysicalNetwork,
        required: requirePhysicalNetwork,
      },
      {
        name: 'provider_segmentation_id',
        label: t('Segmentation ID'),
        type: 'input-int',
        hidden: !hiddenSegmentation,
        required: requireSegmentation,
        min: 1,
        max: this.SegMax,
        extra: this.SegIDTips,
      },
      {
        name: 'subnet_name',
        label: t('Subnet Name'),
        hidden: !create_subnet,
        type: 'input',
        required: create_subnet,
        validator: nameValidateWithoutChinese,
      },
      {
        name: 'ip_version',
        label: t('IP Version'),
        type: 'select',
        options: [
          {
            label: 'ipv4',
            value: 'ipv4',
          },
          {
            label: 'ipv6',
            value: 'ipv6',
          },
        ],
        onChange: (e) => {
          this.setState({
            ip_version: e,
          });
        },
        required: true,
        hidden: !create_subnet,
      },
      {
        name: 'ipv6_address_mode',
        label: t('IP Distribution Mode'),
        type: 'select',
        options: [
          {
            label: 'dhcpv6-stateful',
            value: 'dhcpv6-stateful',
          },
          {
            label: 'dhcpv6-stateless',
            value: 'dhcpv6-stateless',
          },
          {
            label: 'slaac',
            value: 'slaac',
          },
        ],
        hidden: ip_version !== 'ipv6',
      },
      {
        name: 'cidr',
        label: t('CIDR'),
        // TODO 子网掩码待完善
        type: 'input',
        placeholder: isIpv4 ? '192.168.0.0/24' : '1001:1001::/64',
        required: create_subnet,
        validator: (rule, value) => {
          if (!create_subnet && !value) {
            return Promise.resolve();
          }
          if (!this.checkCidr(value)) {
            // eslint-disable-next-line prefer-promise-reject-errors
            return Promise.reject(new Error(t('Invalid CIDR.')));
          }
          return Promise.resolve();
        },
        hidden: !create_subnet,
        tip: isIpv4
          ? t(
              'It is recommended that you use the private network address 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16'
            )
          : t('e.g. 2001:Db8::/48'),
      },
      // {
      //   name: 'connect_router',
      //   label: t('Connect router'),
      //   type: 'check',
      //   onChange: (e) => {
      //     this.setState({
      //       connect_router: e,
      //     });
      //   },
      //   hidden: !create_subnet,
      // },
      // {
      //   name: 'routers',
      //   label: t('Routers'),
      //   type: 'select',
      //   hidden: !connect_router,
      //   options: [
      //     { label: 'test1', value: 'test1' },
      //     { label: 'test2', value: 'test2' },
      //     { label: 'test3', value: 'test3' },
      //   ],
      // },
      {
        name: 'disable_gateway',
        label: t('Disable Gateway'),
        type: 'check',
        onChange: (e) => {
          this.setState({
            disable_gateway: e,
          });
        },
        hidden: !(create_subnet && more),
      },
      {
        name: 'gateway_ip',
        label: t('Gateway IP'),
        type: 'ip-input',
        tip: t(
          'If no gateway is specified, the first IP address will be defaulted.'
        ),
        hidden: !(create_subnet && more && isIpv4 && !disable_gateway),
      },
      {
        name: 'gateway_ip',
        label: t('Gateway IP'),
        type: 'input',
        tip: t(
          'If no gateway is specified, the first IP address will be defaulted.'
        ),
        hidden: !(
          create_subnet &&
          more &&
          ip_version === 'ipv6' &&
          !disable_gateway
        ),
        validator: (rule, value) => {
          if (!this.checkGateway(value)) {
            return Promise.reject(new Error(t('Invalid Ip.')));
          }
          return Promise.resolve();
        },
      },
      {
        name: 'enable_dhcp',
        label: t('DHCP'),
        type: 'radio',
        optionType: 'default',
        options: [
          {
            label: t('Enabled'),
            value: true,
          },
          {
            label: t('Disabled'),
            value: false,
          },
        ],
        hidden: !(create_subnet && more),
      },
      {
        name: 'allocation_pools',
        label: t('Allocation Pools'),
        type: 'textarea',
        extra: t('IP address allocation polls, one enter per line(e.g. {ip})', {
          ip: isIpv4 ? '192.168.1.2,192.168.1.200' : '1001:1001::,1001:1002::',
        }),
        hidden: !(create_subnet && more),
        validator: isIpv4 ? checkAllocation_pools : checkIpv6Allocation_pools,
      },
      {
        name: 'dns',
        label: t('DNS'),
        type: 'textarea',
        extra: t('One entry per line(e.g. {ip})', {
          ip: isIpv4 ? '114.114.114.114' : '1001:1001::/64',
        }),
        hidden: !(create_subnet && more),
        validator: isIpv4 ? checkDNS : checkIpv6DNS,
      },
      {
        name: 'host_routes',
        label: t('Host Routes'),
        type: 'textarea',
        extra: t(
          'Additional routes announced to the instance, one entry per line(e.g. {ip})',
          {
            ip: isIpv4
              ? '192.168.200.0/24,10.56.1.254'
              : '1001:1001::/64,1001:1001',
          }
        ),
        hidden: !(create_subnet && more),
        validator: isIpv4 ? checkHostRoutes : checkIpv6HostRoutes,
      },
      {
        name: 'more',
        label: t('Advanced Options'),
        type: 'more',
        hidden: !create_subnet,
      },
    ];
  }
}