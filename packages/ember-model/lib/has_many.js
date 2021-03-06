require('ember-model/computed');
var get = Ember.get;

function getType(record) {
  var type = this.type;

  if (typeof this.type === "string" && this.type) {
    this.type = get(Ember.lookup, this.type);

    if (!this.type) {
      var store = record.container.lookup('store:main');
      this.type = store.modelFor(type);
      this.type.reopenClass({ adapter: store.adapterFor(type) });
    }
  }

  return this.type;
}

Ember.hasMany = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasMany', getType: getType};

  return Ember.Model.computed({
    get: function(propertyKey) {
      type = meta.getType(this);
      Ember.assert("Type cannot be empty", !Ember.isEmpty(type));

      var key = options.key || propertyKey;
      return this.getHasMany(key, type, meta, this.container);
    },
    set: function(propertyKey, newContentArray, existingArray) {
      if (!existingArray) {
        existingArray = this.getHasMany(options.key || propertyKey, type, meta, this.container);
      }
      // SWRVE CHANGES
      // Check if the arrays are the same,
      // otherwise observers are executed for nothing!
      if (!Ember.isEqual(newContentArray, existingArray)) {
        return existingArray.setObjects(newContentArray);
      }
      return existingArray;
      // END OF SWRVE CHANGES
    }
  }).meta(meta);
};

Ember.Model.reopen({
  getHasMany: function(key, type, meta, container) {
    var embedded = meta.options.embedded,
        collectionClass = embedded ? Ember.EmbeddedHasManyArray : Ember.HasManyArray;

    var collection = collectionClass.create({
      parent: this,
      modelClass: type,
      content: this._getHasManyContent(key, type, embedded),
      embedded: embedded,
      key: key,
      relationshipKey: meta.relationshipKey,
      container: container
    });

    this._registerHasManyArray(collection);

    return collection;
  }
});
