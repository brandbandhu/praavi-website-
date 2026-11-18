const addedPrefix = "added-";
const emptyEdits = Object.freeze({});

function packagePoints(items) {
  return items.map((text, index) => ({ id: `package-${index}`, text }));
}

function applyEdits(points, edits = emptyEdits) {
  const defaults = points.flatMap(({ id, text }) => {
    const editedText = Object.hasOwn(edits, id) ? edits[id] : text;
    return editedText === null ? [] : [{ id, text: editedText }];
  });
  const added = Object.entries(edits)
    .filter(([id]) => id.startsWith(addedPrefix))
    .map(([id, text]) => ({ id, text }));
  return [...defaults, ...added];
}

export function getScopePoints({ tier, choice, addOns, scope, serviceName, edits }) {
  const included = packagePoints(tier.included);
  const service = serviceName?.trim();
  if (service) included.unshift({ id: "service", text: `Service: ${service}` });

  const customization = tier.functionalCustomizationOptions?.find(({ id }) => id === choice);
  if (customization) {
    included.push({ id: `choice-${customization.id}`, text: customization.includedText });
  }

  for (const { id, description } of addOns) {
    included.push({ id: `addon-${id}`, text: `${description} (add-on)` });
  }
  for (const [index, line] of (scope.customAddOn || "").split(/\r?\n/).entries()) {
    const text = line.trim();
    if (text) included.push({ id: `note-${index}-${text}`, text });
  }

  const addOnIds = new Set(addOns.map(({ id }) => id));
  const excluded = packagePoints(tier.excluded).filter(({ text }) =>
    !(addOnIds.has("ecommerce-module") && /e-?commerce/i.test(text)) &&
    !(addOnIds.has("payment-gateway") && /payment gateway/i.test(text)) &&
    !(addOnIds.has("cms-upgrade") && /(admin panel|cms)/i.test(text))
  );

  return {
    included: applyEdits(included, edits?.included),
    excluded: applyEdits(excluded, edits?.excluded),
  };
}

export function scopePointTexts(points) {
  return points.map(({ text }) => text.trim()).filter(Boolean);
}

export function getScopePointEdits(form) {
  return form.scopePointEdits?.[form.companyId]?.[form.tierId];
}

export function updateScopePointEdits(form, section, edits) {
  const companyEdits = form.scopePointEdits?.[form.companyId];
  return {
    ...form,
    scopePointEdits: {
      ...form.scopePointEdits,
      [form.companyId]: {
        ...companyEdits,
        [form.tierId]: { ...getScopePointEdits(form), [section]: edits },
      },
    },
  };
}

export function createScopePointEditor({ createElement: h, useRef }) {
  return function ScopePointEditor({ title, points, edits = emptyEdits, onChange }) {
    const pendingFocus = useRef(null);

    function addPoint() {
      const id = `${addedPrefix}${crypto.randomUUID()}`;
      pendingFocus.current = id;
      onChange({ ...edits, [id]: "" });
    }

    function removePoint(id) {
      const nextEdits = { ...edits };
      if (id.startsWith(addedPrefix)) {
        delete nextEdits[id];
      } else {
        nextEdits[id] = null;
      }
      onChange(nextEdits);
    }

    return h("details", { className: "scope-point-editor" },
      h("summary", null, title),
      h("div", { className: "scope-point-rows" },
        points.map(({ id, text }, index) => h("div", { className: "scope-point-row", key: id },
          h("textarea", {
            rows: 2,
            value: text,
            "aria-label": `${title}, point ${index + 1}`,
            onChange: (event) => onChange({ ...edits, [id]: event.target.value }),
            ref: (input) => {
              if (input && pendingFocus.current === id) {
                pendingFocus.current = null;
                input.focus();
              }
            },
          }),
          h("button", {
            type: "button",
            className: "link-btn",
            "aria-label": `Remove point ${index + 1} from ${title}`,
            onClick: () => removePoint(id),
          }, "Remove")
        ))
      ),
      h("div", { className: "scope-point-actions" },
        h("button", { type: "button", className: "btn secondary", onClick: addPoint }, "Add point"),
        Object.keys(edits).length > 0 && h("button", {
          type: "button",
          className: "link-btn",
          onClick: () => onChange(undefined),
        }, "Reset to package defaults")
      )
    );
  };
}
