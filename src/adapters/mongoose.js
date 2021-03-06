const getList = function(options, req) {
  let query = options.model
    .find(req.query.filter);

  if (options.populate) {
    const populate = Array.isArray(options.populate) ?
      options.populate :
      [options.populate];
    populate.forEach(pop => {
      pop = Array.isArray(pop) ? pop : [pop];
      query = query.populate(...pop);
    });
  }

  if (req.query.sort) {
    const fields = req.query.sort.split(',');
    const sort = {};
    fields.forEach(field => {
      const order = field.charAt(0) === '-' ? -1 : 1;
      field = order === 1 ? field : field.substr(1);
      sort[field] = order;
    });
    query = query.sort(sort);
  }

  if (req.query.page) {
    const limit = req.query.page.limit || req.query.page.size;
    const offset = req.query.page.offset || (req.query.page.number - 1) * limit;
    query = query.limit(parseInt(limit, 10)).skip(parseInt(offset, 10));
  }

  if (options.parseQuery) {
    query = options.parseQuery(query, req);
  }

  return query
    .lean()
    .exec();
};

const get = function(options, req) {
  let query = options.model
    .findById(req.params.id)
    .populate(options.populate);

  if (options.parseQuery) {
    query = options.parseQuery(query, req);
  }

  return query
    .lean()
    .exec();
};

const post = function(options, req) {
  const m = Object.assign({}, req.body.data.attributes);

  return options.model
    .create(m)
    .then(function(obj) {
      return options.model
        .populate(obj, buildPopulateOpts(options.populate));
    })
    .then(function(obj) {
      return obj.toObject();
    });
};

const patch = function(options, req) {
  return options.model
    .findById(req.params.id)
    .exec()
    .then(function(obj) {
      Object.assign(obj, req.body.data.attributes);

      return obj
        .save()
        .then(function(newObj) {
          return options.model
            .populate(newObj, buildPopulateOpts(options.populate));
        })
        .then(function(obj) {
          return obj.toObject();
        });
    });
};

const put = function(options, req) {
  return patch(options, req);
};

const remove = function(options, req) {
  return options.model
    .findById(req.params.id)
    .exec()
    .then(function(obj) {
      return obj.remove();
    });
};

const getId = function(obj) {
  return obj._id;
};

const buildPopulateOpts = function(populate) {
  populate = Array.isArray(populate) ? populate : [populate];
  return populate.map(pop => {
    pop = Array.isArray(pop) ? pop : [pop];
    return {path: pop[0], select: pop[1]};
  });
};

module.exports = {
  get,
  getList,
  post,
  put,
  patch,
  delete: remove,
  getId
}
