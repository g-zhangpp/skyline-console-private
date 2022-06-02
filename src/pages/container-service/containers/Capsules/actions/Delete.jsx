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

import { ConfirmAction } from 'containers/Action';
import globalCapsulesStore from 'src/stores/zun/capsules';

export default class DeleteCapsule extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Capsule');
  }

  get actionName() {
    return t('Delete Capsule');
  }

  get buttonText() {
    return t('Delete');
  }

  get buttonType() {
    return 'danger';
  }

  policy = 'container:capsule:delete';

  allowedCheckFunc = () => true;

  onSubmit = (data) => globalCapsulesStore.delete({ id: data.uuid });
}