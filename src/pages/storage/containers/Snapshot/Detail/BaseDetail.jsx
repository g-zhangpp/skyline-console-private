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
import Base from 'containers/BaseDetail';

export class BaseDetail extends Base {
  get leftCards() {
    return [this.volumeCard];
  }

  get volumeCard() {
    const options = [
      {
        label: t('Volume'),
        dataIndex: 'volume_id',
        render: (value, record) => {
          if (!value) {
            return '-';
          }
          const link = this.getLinkRender(
            'volumeDetail',
            record.volume_name || value,
            { id: value },
            { tab: 'snapshot' }
          );
          return link;
        },
      },
    ];
    return {
      title: t('Snapshot Source'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
