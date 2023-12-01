import { TestHelper } from '../utils/helpers';
import { FormHelper } from '../utils/form_helpers';

export class BaseModel {
  page;

  constructor(page) {
    this.page = page;
  }

  getFormFields() {
    return Object.entries(this)
      .filter((f) => TestHelper.hasValue(f[1]) && TestHelper.hasValue(f[1].form))
      .map((o) => {
        return { name: o[0], meta: o[1] };
      });
  }

  async filloutForm(instance = 0, skipProps = []) {
    for (const f of Object.entries(this).filter((f) => TestHelper.hasValue(f[1]) && TestHelper.hasValue(f[1].form))) {
      if (skipProps.includes(f[0])) continue;
      await FormHelper.genericSetFieldVal(f[1].form, f[1].value, instance);
    }
  }
}
