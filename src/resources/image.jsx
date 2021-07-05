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
import ImageType from 'components/ImageType';
import { get } from 'lodash';
import globalRootStore from 'stores/root';

export const imageStatus = {
  active: t('Active'),
  saving: t('Saving'),
  queued: t('Queued'),
  pending_delete: t('Pending Delete'),
  killed: t('Killed'),
  deactivated: t('Deactivated'),
  deleted: t('Deleted'),
};

export const imageVisibility = {
  public: t('Public'),
  private: t('Private'),
  shared: t('Shared'),
  // unknown: t('Unknown'),
};

export const imageOS = {
  centos: t('CentOS'),
  ubuntu: t('Ubuntu'),
  fedora: t('Fedora'),
  windows: t('Windows'),
  debian: t('Debian'),
  coreos: t('CoreOS'),
  arch: t('Arch'),
  freebsd: t('FreeBSD'),
  others: t('Others'),
};

export const imageUsage = {
  common: t('Common Server'),
  ironic: t('Bare Metal'),
  ironic_enroll: t('Bare Metal Enroll'),
  octavia: t('Load Balancer'),
  trove: t('Database'),
  magnum: t('Container'),
  heat: t('Application Template'),
};

export const imageFormats = {
  raw: t('Raw'),
  qcow2: t('QCOW2 - QEMU Emulator'),
  iso: t('ISO - Optical Disk Image'),
  ova: t('OVA - Open Virtual Appliance'),
  vdi: t('VDI - Virtual Disk Image'),
  vhd: t('VHD - Virtual Hard Disk'),
  vmdk: t('VMDK - Virtual Machine Disk'),
  aki: t('AKI - Amazon Kernel Image'),
  ami: t('AMI - Amazon Machine Image'),
  ari: t('ARI - Amazon Ramdisk Image'),
  docker: t('Docker'),
  ploop: t('PLOOP - Virtuozzo/Parallels Loopback Disk'),
};

export const imageProperties = {
  id: t('ID'),
  checksum: t('Checksum'),
  members: t('Members'),
  min_disk: t('Min. Disk'),
  min_ram: t('Min. RAM'),
  name: t('Name'),
  owner: t('Owner'),
  tags: t('Tags'),
  updated_at: t('Updated At'),
  virtual_size: t('Virtual Size'),
  visibility: t('Visibility'),
  description: t('Description'),
  architecture: t('Architecture'),
  kernel_id: t('Kernel ID'),
  ramdisk_id: t('Ramdisk ID'),
  created_at: t('Created At'),
  container_format: { label: t('Container Format'), filter: 'uppercase' },
  disk_format: { label: t('Disk Format'), filter: 'uppercase' },
  is_public: { label: t('Is Public'), filter: 'yesNo' },
  type: t('Type'),
  protected: { label: t('Protected'), filter: 'yesNo' },
  size: { label: t('Size'), filter: 'bytes' },
  status: t('Status'),
};

export const transitionStatusList = ['saving', 'queued', 'pending_delete'];

export const isOwnerOrAdmin = (item) => {
  if (globalRootStore.projectId === item.owner) {
    return true;
  }
  return globalRootStore.hasAdminRole;
};

export const isOwner = (item) => {
  if (globalRootStore.projectId === item.owner) {
    return true;
  }
  return false;
};

export const isSnapshot = (item) => {
  const { block_device_mapping: bdm = '[]', image_type } = item;
  return (
    image_type === 'snapshot' ||
    get(JSON.parse(bdm)[0] || {}, 'source_type') === 'snapshot'
  );
};

export const canImageCreateInstance = (item) =>
  item.status === 'active' && item.usage_type === 'common';

export const canImageCreateIronicInstance = (item) =>
  item.status === 'active' && item.usage_type === 'ironic';

export const canSnapshotCreateInstance = (item) => item.status === 'active';

export const getImageSystemTabs = () => {
  const valueList = [
    'centos',
    'ubuntu',
    'fedora',
    'windows',
    'debian',
    'coreos',
    'arch',
    'freebsd',
    'others',
  ];
  return valueList.map((value) => {
    const label =
      value !== 'others'
        ? value.slice(0, 1).toUpperCase() + value.slice(1)
        : t('Others');
    return {
      label,
      value,
      component: <ImageType type={value} />,
    };
  });
};

export const getImageOS = (item) =>
  imageOS[item.os_distro] ? item.os_distro : 'others';

export const getImageColumns = (self) => [
  {
    title: t('Name'),
    dataIndex: 'name',
  },
  {
    title: t('Project'),
    dataIndex: 'project_name',
    hidden: !self.hasAdminRole,
  },
  {
    title: t('Current Project'),
    dataIndex: 'owner',
    hidden: !self.hasAdminRole,
    render: (value) => (value === self.currentProjectId ? t('Yes') : t('No')),
  },
  {
    title: t('System'),
    dataIndex: 'os_distro',
    render: (value) => imageOS[value] || value,
  },
  {
    title: t('OS Version'),
    dataIndex: 'os_version',
  },
  {
    title: t('Min System Disk'),
    dataIndex: 'min_disk',
    render: (text) => `${text}GB`,
  },
  {
    title: t('Min Memory'),
    dataIndex: 'min_ram',
    render: (text) => `${text / 1024}GB`,
  },
  {
    title: t('Access Control'),
    dataIndex: 'visibility',
    render: (value) => imageVisibility[value] || '-',
  },
  {
    title: t('Format'),
    dataIndex: 'disk_format',
    render: (value) => imageFormats[value] || '-',
  },
  {
    title: t('Image Size'),
    dataIndex: 'size',
    valueRender: 'formatSize',
  },
];