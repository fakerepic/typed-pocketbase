// src/filter.ts
function serializeFilterTuple([key, op, val]) {
  const type = typeof val;
  if (type === "boolean" || type === "number") {
    val = val.toString();
  } else if (type === "string") {
    val = "'" + val.replace(/'/g, "\\'") + "'";
  } else if (val === null) {
    val = "null";
  } else if (val instanceof Date) {
    val = "'" + val.toISOString().replace("T", " ") + "'";
  } else {
    val = "'" + JSON.stringify(val).replace(/'/g, "\\'") + "'";
  }
  return `${String(key)} ${op} ${val}`;
}
function serializeFilter(filter) {
  if (!filter)
    return null;
  return Array.isArray(filter) ? serializeFilterTuple(filter) : filter;
}
function serializeFilters(filters) {
  return filters.filter((val) => !!val).map(serializeFilter);
}
function and(...filters) {
  const str = serializeFilters(filters).join(" && ");
  if (!str.length)
    return "";
  return `(${str})`;
}
function or(...filters) {
  const str = serializeFilters(filters).join(" || ");
  if (!str.length)
    return "";
  return `(${str})`;
}
function eq(column, value) {
  return serializeFilterTuple([column, "=", value]);
}
function neq(column, value) {
  return serializeFilterTuple([column, "!=", value]);
}
function gt(column, value) {
  return serializeFilterTuple([column, ">", value]);
}
function gte(column, value) {
  return serializeFilterTuple([column, ">=", value]);
}
function lt(column, value) {
  return serializeFilterTuple([column, "<", value]);
}
function lte(column, value) {
  return serializeFilterTuple([column, "<=", value]);
}
function like(column, value) {
  return serializeFilterTuple([column, "~", value]);
}
function nlike(column, value) {
  return serializeFilterTuple([column, "!~", value]);
}

// src/client.ts
import PocketBase from "pocketbase";

// src/select.ts
function resolveSelect(select) {
  const fieldList = [];
  const expandList = [];
  if (select) {
    (function recurse({ expand, ...rest }, fieldsParent = [], expandParent = []) {
      if (Object.keys(rest).length === 0) {
        fieldList.push([...fieldsParent, "*"].join("."));
      } else {
        for (const key in rest) {
          if (rest[key]) {
            fieldList.push([...fieldsParent, key].join("."));
          }
        }
      }
      if (expand) {
        for (const key in expand) {
          const sub = expand[key];
          if (sub === true) {
            expandList.push([...expandParent, key].join("."));
            fieldList.push(
              [...fieldsParent, "expand", key, "*"].join(".")
            );
          } else if (sub) {
            expandList.push([...expandParent, key].join("."));
            recurse(
              sub,
              [...fieldsParent, "expand", key],
              [...expandParent, key]
            );
          }
        }
      }
    })(select);
  } else {
    fieldList.push("*");
  }
  return {
    fields: fieldList.join(","),
    expand: expandList.join(",")
  };
}

// src/client.ts
var FORWARD_METHODS = [
  "unsubscribe",
  "listAuthMethods",
  "requestPasswordReset",
  "confirmPasswordReset",
  "requestVerification",
  "confirmVerification",
  "requestEmailChange",
  "confirmEmailChange",
  "listExternalAuths",
  "unlinkExternalAuth"
];
var TypedRecordService = class {
  constructor(service) {
    this.service = service;
    for (const name of FORWARD_METHODS) {
      this[name] = this.service[name].bind(this.service);
    }
  }
  get client() {
    return this.service.client;
  }
  get collectionName() {
    return this.service.collectionIdOrName;
  }
  prepareOptions({
    select,
    filter,
    sort,
    ...options
  } = {}) {
    const { expand, fields } = resolveSelect(select);
    if (fields)
      options.fields = fields;
    if (expand)
      options.expand = expand;
    if (filter)
      options.filter = serializeFilter(filter) ?? "";
    if (Array.isArray(sort) && sort.length) {
      options.sort = sort.join(",");
    } else if (sort) {
      options.sort = sort;
    }
    return options;
  }
  createFilter(filter) {
    return serializeFilter(filter);
  }
  createSort(...sorters) {
    return sorters.filter((x) => typeof x === "string").join(",");
  }
  createSelect(select) {
    return select;
  }
  subscribe(topic, callback, options) {
    return this.service.subscribe(
      topic,
      callback,
      this.prepareOptions(options)
    );
  }
  getFullList(options) {
    return this.service.getFullList(this.prepareOptions(options));
  }
  getList(page, perPage, options) {
    return this.service.getList(
      page,
      perPage,
      this.prepareOptions(options)
    );
  }
  getFirstListItem(filter, options) {
    return this.service.getFirstListItem(
      filter,
      this.prepareOptions(options)
    );
  }
  getOne(id, options) {
    return this.service.getOne(id, this.prepareOptions(options));
  }
  create(bodyParams, options) {
    return this.service.create(bodyParams, this.prepareOptions(options));
  }
  update(id, bodyParams, options) {
    return this.service.update(
      id,
      bodyParams,
      this.prepareOptions(options)
    );
  }
  delete(id, options) {
    return this.service.delete(id, this.prepareOptions(options));
  }
  authWithPassword(usernameOrEmail, password, options) {
    return this.service.authWithPassword(
      usernameOrEmail,
      password,
      this.prepareOptions(options)
    );
  }
  authWithOAuth2Code(provider, code, codeVerifier, redirectUrl, createData, options) {
    return this.service.authWithOAuth2Code(
      provider,
      code,
      codeVerifier,
      redirectUrl,
      createData,
      this.prepareOptions(options)
    );
  }
  authWithOAuth2(options) {
    return this.service.authWithOAuth2(options);
  }
  authRefresh(options) {
    return this.service.authRefresh(this.prepareOptions(options));
  }
};
var TypedPocketBase = class extends PocketBase {
  from(name) {
    return new TypedRecordService(this.collection(name));
  }
};
export {
  TypedPocketBase,
  TypedRecordService,
  and,
  eq,
  gt,
  gte,
  like,
  lt,
  lte,
  neq,
  nlike,
  or
};
//# sourceMappingURL=index.js.map