export default class SwyversActorBase extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    //TODO: remove
    schema.health = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 10 })
    });
    schema.power = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 5, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 5 })
    });
    schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

    return schema;
  }

  async getAttributeModifier(attribute) {
    switch (attribute) {
      case "dex":
        return this.getDexModifier();
      default:
        return 0;
    }
  }

  async getDexModifier() {
    const dexModifier = Math.max(this.parent.items.filter(it => it.system.container == "backpack").length - 10, 0);
    return -dexModifier;
  }
}