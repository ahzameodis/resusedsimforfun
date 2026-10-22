/* @ds-bundle: {"format":4,"namespace":"HeyhanDesignSystem_50811e","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"dbbd57591ce8","components/core/Badge.jsx":"34d0af1c3469","components/core/Card.jsx":"a248381ccefb","components/core/Icon.jsx":"ae1a97c8cd29","components/core/Tag.jsx":"2aa0c06cd200","components/feedback/Alert.jsx":"89a4de814b90","components/feedback/Dialog.jsx":"61c91b0b77a1","components/feedback/Spinner.jsx":"69e62b27ba73","components/feedback/Toast.jsx":"2efd3683be30","components/feedback/Tooltip.jsx":"e4c2e25d899c","components/forms/Button.jsx":"c45227a1fe9a","components/forms/Checkbox.jsx":"7f432fd23555","components/forms/IconButton.jsx":"441cb504f2a1","components/forms/Input.jsx":"b5b9424a1532","components/forms/Radio.jsx":"d6e334555c04","components/forms/Select.jsx":"99eacf2ec1a1","components/forms/Switch.jsx":"c0158e799dd2","components/forms/Textarea.jsx":"f17663cb66eb","components/navigation/Tabs.jsx":"fa7791c7d4b9","ui_kits/clinician-dashboard/dashboard.jsx":"2d3b1c99a8af","ui_kits/marketing-site/site.jsx":"8fd4c65b1002","ui_kits/patient-app/screens.jsx":"8816000a544e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HeyhanDesignSystem_50811e = window.HeyhanDesignSystem_50811e || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72
};
const fontFor = {
  xs: 10,
  sm: 13,
  md: 15,
  lg: 19,
  xl: 26
};
function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}

/** User/clinician avatar — image, initials fallback, optional status dot. */
function Avatar({
  src,
  name = '',
  size = 'md',
  status,
  ring = false,
  style,
  ...rest
}) {
  const dim = sizes[size] || sizes.md;
  const statusColor = {
    online: 'var(--success)',
    busy: 'var(--danger)',
    away: 'var(--warning)',
    offline: 'var(--neutral-400)'
  }[status];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      flex: 'none',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: dim,
      height: dim,
      borderRadius: 'var(--radius-full)',
      overflow: 'hidden',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gradient-brand)',
      color: '#fff',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: fontFor[size],
      boxShadow: ring ? '0 0 0 3px var(--surface-card)' : 'none'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials(name)), statusColor && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: Math.max(8, dim * 0.28),
      height: Math.max(8, dim * 0.28),
      borderRadius: '50%',
      background: statusColor,
      border: '2px solid var(--surface-card)'
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Surface container. Use for grouped content, list items, and panels. */
function Card({
  children,
  elevation = 'sm',
  padding = 20,
  interactive = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const shadow = {
    none: 'none',
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)'
  }[elevation] || 'var(--shadow-sm)';
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding,
      boxShadow: interactive && hover ? 'var(--shadow-md)' : shadow,
      transition: 'box-shadow var(--dur) var(--ease-out), transform var(--dur) var(--ease-out)',
      transform: interactive && hover ? 'translateY(-2px)' : 'none',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Icon — renders any Lucide glyph as inline SVG, inheriting `currentColor`.
 * The SVG markup is fetched once per name and cached, so it recolors cleanly
 * and renders reliably in screenshots, PDF, and PPTX export (unlike CSS masks).
 */
const _cache = {};
const _version = '0.436.0';
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  style,
  className,
  ...rest
}) {
  const [markup, setMarkup] = React.useState(_cache[name] || null);
  React.useEffect(() => {
    let alive = true;
    if (_cache[name]) {
      setMarkup(_cache[name]);
      return;
    }
    fetch(`https://unpkg.com/lucide-static@${_version}/icons/${name}.svg`).then(r => r.ok ? r.text() : Promise.reject()).then(t => {
      const svg = t.replace(/width="24"/, 'width="100%"').replace(/height="24"/, 'height="100%"').replace(/stroke-width="2"/, `stroke-width="${strokeWidth}"`);
      _cache[name] = svg;
      if (alive) setMarkup(svg);
    }).catch(() => {});
    return () => {
      alive = false;
    };
  }, [name, strokeWidth]);
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": name,
    className: className,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flex: 'none',
      lineHeight: 0,
      ...style
    },
    dangerouslySetInnerHTML: markup ? {
      __html: markup
    } : undefined
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  neutral: {
    bg: 'var(--neutral-100)',
    fg: 'var(--neutral-700)'
  },
  brand: {
    bg: 'var(--blue-50)',
    fg: 'var(--blue-700)'
  },
  accent: {
    bg: 'var(--cyan-50)',
    fg: 'var(--cyan-700)'
  },
  success: {
    bg: 'var(--success-soft)',
    fg: 'var(--success-strong)'
  },
  warning: {
    bg: 'var(--warning-soft)',
    fg: 'var(--warning-strong)'
  },
  danger: {
    bg: 'var(--danger-soft)',
    fg: 'var(--danger-strong)'
  },
  solid: {
    bg: 'var(--action)',
    fg: '#fff'
  }
};

/** Small status label. Use `dot` for a status indicator, `icon` for a leading glyph. */
function Badge({
  children,
  tone = 'neutral',
  dot = false,
  icon,
  style,
  ...rest
}) {
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 24,
      padding: dot || icon ? '0 10px 0 8px' : '0 10px',
      background: t.bg,
      color: t.fg,
      borderRadius: 'var(--radius-full)',
      fontFamily: 'var(--font-body)',
      fontSize: 12.5,
      fontWeight: 600,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: 'currentColor',
      flex: 'none'
    }
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Removable tag / chip for filters, categories, and selections. */
function Tag({
  children,
  icon,
  onRemove,
  selected = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 30,
      padding: '0 6px 0 12px',
      background: selected ? 'var(--blue-500)' : 'var(--surface-card)',
      color: selected ? '#fff' : 'var(--text-body)',
      border: `1px solid ${selected ? 'transparent' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-full)',
      fontFamily: 'var(--font-body)',
      fontSize: 13.5,
      fontWeight: 500,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      paddingRight: onRemove ? 0 : 6
    }
  }, children), onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    "aria-label": "Remove",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
      marginLeft: 2,
      border: 'none',
      background: 'transparent',
      color: 'inherit',
      cursor: 'pointer',
      borderRadius: 'var(--radius-full)',
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 13
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  info: {
    bg: 'var(--cyan-50)',
    border: 'var(--cyan-200)',
    fg: 'var(--cyan-700)',
    icon: 'info'
  },
  success: {
    bg: 'var(--success-soft)',
    border: 'color-mix(in oklch, var(--success) 30%, white)',
    fg: 'var(--success-strong)',
    icon: 'circle-check'
  },
  warning: {
    bg: 'var(--warning-soft)',
    border: 'color-mix(in oklch, var(--warning) 35%, white)',
    fg: 'var(--warning-strong)',
    icon: 'triangle-alert'
  },
  danger: {
    bg: 'var(--danger-soft)',
    border: 'color-mix(in oklch, var(--danger) 30%, white)',
    fg: 'var(--danger-strong)',
    icon: 'octagon-alert'
  }
};

/** Inline alert / callout banner. */
function Alert({
  tone = 'info',
  title,
  children,
  icon,
  onClose,
  style,
  ...rest
}) {
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "alert",
    style: {
      display: 'flex',
      gap: 12,
      padding: '14px 16px',
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || t.icon,
    size: 20,
    style: {
      color: t.fg,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 15,
      color: 'var(--text-strong)',
      marginBottom: children ? 3 : 0
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)',
      lineHeight: 1.5
    }
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      border: 'none',
      background: 'transparent',
      color: t.fg,
      cursor: 'pointer',
      padding: 2,
      alignSelf: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Modal dialog with overlay. Controlled via `open`/`onClose`. */
function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 460,
  icon,
  tone = 'brand',
  style,
  ...rest
}) {
  if (!open) return null;
  const iconTone = {
    brand: {
      bg: 'var(--blue-50)',
      fg: 'var(--blue-600)'
    },
    danger: {
      bg: 'var(--danger-soft)',
      fg: 'var(--danger)'
    },
    success: {
      bg: 'var(--success-soft)',
      fg: 'var(--success-strong)'
    }
  }[tone] || {
    bg: 'var(--blue-50)',
    fg: 'var(--blue-600)'
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'color-mix(in oklch, var(--neutral-950) 45%, transparent)',
      backdropFilter: 'blur(4px)',
      animation: 'heyhan-fade 0.2s var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: '100%',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-2xl)',
      boxShadow: 'var(--shadow-xl)',
      padding: 24,
      animation: 'heyhan-pop 0.24s var(--ease-spring)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 44,
      height: 44,
      borderRadius: 'var(--radius-md)',
      background: iconTone.bg,
      color: iconTone.fg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontSize: 15,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, description)), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      border: 'none',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      padding: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 18
  }))), children && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 24
    }
  }, footer), /*#__PURE__*/React.createElement("style", null, '@keyframes heyhan-fade{from{opacity:0}}@keyframes heyhan-pop{from{opacity:0;transform:translateY(8px) scale(0.97)}}')));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Circular loading spinner. */
function Spinner({
  size = 24,
  thickness = 3,
  color = 'var(--action)',
  label,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "status",
    "aria-label": label || 'Loading',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      border: `${thickness}px solid color-mix(in oklch, ${color} 22%, transparent)`,
      borderTopColor: color,
      display: 'inline-block',
      animation: 'heyhan-spinner 0.7s linear infinite'
    }
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("style", null, '@keyframes heyhan-spinner{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  neutral: {
    fg: 'var(--text-strong)',
    icon: null,
    iconColor: 'var(--text-muted)'
  },
  success: {
    fg: 'var(--text-strong)',
    icon: 'circle-check',
    iconColor: 'var(--success)'
  },
  danger: {
    fg: 'var(--text-strong)',
    icon: 'octagon-alert',
    iconColor: 'var(--danger)'
  },
  info: {
    fg: 'var(--text-strong)',
    icon: 'info',
    iconColor: 'var(--info)'
  }
};

/** Transient notification toast (presentational — you control mount/dismiss). */
function Toast({
  tone = 'neutral',
  title,
  description,
  icon,
  onClose,
  style,
  ...rest
}) {
  const t = tones[tone] || tones.neutral;
  const glyph = icon || t.icon;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      width: 360,
      maxWidth: '90vw',
      padding: '14px 16px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      ...style
    }
  }, rest), glyph && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: glyph,
    size: 20,
    style: {
      color: t.iconColor,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 14.5,
      color: t.fg
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-muted)',
      marginTop: 2,
      lineHeight: 1.45
    }
  }, description)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      border: 'none',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      padding: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Hover/focus tooltip. Wraps a single child trigger. */
function Tooltip({
  label,
  placement = 'top',
  children,
  style,
  ...rest
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 8
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 8
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 8
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 8
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, children, show && /*#__PURE__*/React.createElement("span", _extends({
    role: "tooltip",
    style: {
      position: 'absolute',
      zIndex: 900,
      ...pos,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      background: 'var(--neutral-900)',
      color: '#fff',
      fontSize: 12.5,
      fontWeight: 500,
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-md)',
      animation: 'heyhan-tip 0.14s var(--ease-out)',
      ...style
    }
  }, rest), label, /*#__PURE__*/React.createElement("style", null, '@keyframes heyhan-tip{from{opacity:0;transform:translate(-50%,2px)}}')));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: {
    height: 'var(--control-h-sm)',
    padding: '0 14px',
    fontSize: 14,
    gap: 7,
    icon: 16,
    radius: 'var(--radius-md)'
  },
  md: {
    height: 'var(--control-h-md)',
    padding: '0 18px',
    fontSize: 15,
    gap: 8,
    icon: 18,
    radius: 'var(--radius-md)'
  },
  lg: {
    height: 'var(--control-h-lg)',
    padding: '0 24px',
    fontSize: 16,
    gap: 9,
    icon: 20,
    radius: 'var(--radius-lg)'
  }
};
const variants = {
  primary: {
    background: 'var(--action)',
    color: 'var(--text-on-brand)',
    border: '1px solid transparent',
    boxShadow: 'var(--shadow-brand)'
  },
  secondary: {
    background: 'var(--surface-brand-soft)',
    color: 'var(--blue-700)',
    border: '1px solid transparent'
  },
  outline: {
    background: 'var(--surface-card)',
    color: 'var(--text-strong)',
    border: '1px solid var(--border-default)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-body)',
    border: '1px solid transparent'
  },
  danger: {
    background: 'var(--danger)',
    color: '#fff',
    border: '1px solid transparent'
  }
};
const hoverBg = {
  primary: 'var(--action-hover)',
  secondary: 'var(--action-soft-hover)',
  outline: 'var(--surface-sunken)',
  ghost: 'var(--surface-sunken)',
  danger: 'var(--danger-strong)'
};

/** Primary call-to-action button in the Heyhan system. */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  as = 'button',
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const isDisabled = disabled || loading;
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    disabled: Tag === 'button' ? isDisabled : undefined,
    onMouseEnter: e => {
      setHover(true);
      onMouseEnter && onMouseEnter(e);
    },
    onMouseLeave: e => {
      setHover(false);
      onMouseLeave && onMouseLeave(e);
    },
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: fullWidth ? '100%' : 'auto',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: s.fontSize,
      letterSpacing: '-0.01em',
      lineHeight: 1,
      borderRadius: s.radius,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.55 : 1,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      transition: 'background var(--dur) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
      transform: hover && !isDisabled ? 'translateY(-1px)' : 'none',
      ...v,
      background: hover && !isDisabled ? hoverBg[variant] : v.background,
      ...style
    }
  }, rest), loading && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "loader-circle",
    size: s.icon,
    style: {
      animation: 'heyhan-spin 0.8s linear infinite'
    }
  }), !loading && iconLeft && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: s.icon
  }), children, !loading && iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }), /*#__PURE__*/React.createElement("style", null, '@keyframes heyhan-spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Checkbox with label. Controlled via `checked`/`onChange` or uncontrolled. */
function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  disabled,
  id,
  onChange,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = e => {
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  const inputId = id || (label ? `cb-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: description ? 'flex-start' : 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      flex: 'none',
      width: 20,
      height: 20,
      borderRadius: 'var(--radius-xs)',
      border: on ? '1px solid var(--action)' : '1px solid var(--border-strong)',
      background: on ? 'var(--action)' : 'var(--surface-card)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: description ? 1 : 0,
      transition: 'background var(--dur) var(--ease-out), border-color var(--dur) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    id: inputId,
    checked: on,
    disabled: disabled,
    onChange: toggle,
    style: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      cursor: 'inherit'
    }
  }, rest)), on && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14,
    style: {
      color: '#fff'
    }
  })), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: 34,
  md: 42,
  lg: 52
};
const iconSizes = {
  sm: 17,
  md: 20,
  lg: 22
};
const variants = {
  primary: {
    background: 'var(--action)',
    color: '#fff'
  },
  soft: {
    background: 'var(--surface-brand-soft)',
    color: 'var(--blue-700)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)'
  },
  outline: {
    background: 'var(--surface-card)',
    color: 'var(--text-body)',
    border: '1px solid var(--border-default)'
  }
};
const hoverBg = {
  primary: 'var(--action-hover)',
  soft: 'var(--action-soft-hover)',
  ghost: 'var(--surface-sunken)',
  outline: 'var(--surface-sunken)'
};

/** Square icon-only button for toolbars and dense controls. */
function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  round = false,
  disabled = false,
  label,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const dim = sizes[size] || sizes.md;
  const v = variants[variant] || variants.ghost;
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: round ? 'var(--radius-full)' : 'var(--radius-md)',
      border: '1px solid transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background var(--dur) var(--ease-out)',
      ...v,
      background: hover && !disabled ? hoverBg[variant] : v.background,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iconSizes[size]
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Labelled text input with optional leading icon, hint and error states. */
function Input({
  label,
  hint,
  error,
  icon,
  size = 'md',
  id,
  required,
  style,
  containerStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || (label ? `in-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const h = {
    sm: 'var(--control-h-sm)',
    md: 'var(--control-h-md)',
    lg: 'var(--control-h-lg)'
  }[size];
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-strong)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--danger)',
      marginLeft: 3
    }
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: h,
      padding: '0 14px',
      background: 'var(--surface-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? `0 0 0 3px ${error ? 'var(--danger-soft)' : 'var(--ring-focus)'}` : 'none',
      transition: 'border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    style: {
      color: 'var(--text-subtle)'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    required: required,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--text-strong)',
      minWidth: 0
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: error ? 'var(--danger-strong)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Single radio option. Group several with the same `name`. */
function Radio({
  label,
  description,
  checked,
  defaultChecked,
  disabled,
  name,
  value,
  id,
  onChange,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const change = e => {
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  const inputId = id || `rd-${name || ''}-${value || label}`;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: description ? 'flex-start' : 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      flex: 'none',
      width: 20,
      height: 20,
      borderRadius: 'var(--radius-full)',
      border: on ? '6px solid var(--action)' : '1px solid var(--border-strong)',
      background: 'var(--surface-card)',
      marginTop: description ? 1 : 0,
      transition: 'border var(--dur) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    id: inputId,
    name: name,
    value: value,
    checked: on,
    disabled: disabled,
    onChange: change,
    style: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      cursor: 'inherit'
    }
  }, rest))), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native-select wrapper styled to match Heyhan inputs. */
function Select({
  label,
  hint,
  error,
  options = [],
  placeholder,
  size = 'md',
  id,
  required,
  style,
  containerStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || (label ? `se-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const h = {
    sm: 'var(--control-h-sm)',
    md: 'var(--control-h-md)',
    lg: 'var(--control-h-lg)'
  }[size];
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-strong)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--danger)',
      marginLeft: 3
    }
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: inputId,
    required: required,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: h,
      padding: '0 40px 0 14px',
      background: 'var(--surface-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--text-strong)',
      cursor: 'pointer',
      outline: 'none',
      boxShadow: focus ? `0 0 0 3px ${error ? 'var(--danger-soft)' : 'var(--ring-focus)'}` : 'none',
      transition: 'border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
      ...style
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), opts.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 18,
    style: {
      position: 'absolute',
      right: 14,
      color: 'var(--text-muted)',
      pointerEvents: 'none'
    }
  })), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: error ? 'var(--danger-strong)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** On/off toggle switch. */
function Switch({
  label,
  checked,
  defaultChecked,
  disabled,
  id,
  onChange,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = e => {
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  const inputId = id || (label ? `sw-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'inline-flex',
      gap: 10,
      alignItems: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 40,
      height: 24,
      flex: 'none',
      borderRadius: 'var(--radius-full)',
      background: on ? 'var(--action)' : 'var(--neutral-300)',
      transition: 'background var(--dur) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    id: inputId,
    checked: on,
    disabled: disabled,
    onChange: toggle,
    style: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      cursor: 'inherit'
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: on ? 19 : 3,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-sm)',
      transition: 'left var(--dur) var(--ease-spring)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Multi-line text input with label, hint and error states. */
function Textarea({
  label,
  hint,
  error,
  id,
  required,
  rows = 4,
  style,
  containerStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || (label ? `ta-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-strong)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--danger)',
      marginLeft: 3
    }
  }, "*")), /*#__PURE__*/React.createElement("textarea", _extends({
    id: inputId,
    rows: rows,
    required: required,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      resize: 'vertical',
      padding: '11px 14px',
      background: 'var(--surface-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--text-strong)',
      lineHeight: 1.55,
      outline: 'none',
      boxShadow: focus ? `0 0 0 3px ${error ? 'var(--danger-soft)' : 'var(--ring-focus)'}` : 'none',
      transition: 'border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out)',
      ...style
    }
  }, rest)), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: error ? 'var(--danger-strong)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Horizontal tab navigation. Controlled (`value`) or uncontrolled (`defaultValue`). */
function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  variant = 'underline',
  style,
  ...rest
}) {
  const items = tabs.map(t => typeof t === 'string' ? {
    value: t,
    label: t
  } : t);
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value);
  const active = value !== undefined ? value : internal;
  const select = v => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  const pill = variant === 'pill';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'inline-flex',
      gap: pill ? 4 : 4,
      padding: pill ? 4 : 0,
      background: pill ? 'var(--surface-sunken)' : 'transparent',
      borderRadius: pill ? 'var(--radius-full)' : 0,
      borderBottom: pill ? 'none' : '1px solid var(--border-subtle)',
      ...style
    }
  }, rest), items.map(t => {
    const on = t.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      role: "tab",
      "aria-selected": on,
      onClick: () => select(t.value),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 14.5,
        padding: pill ? '7px 16px' : '10px 4px',
        marginBottom: pill ? 0 : -1,
        color: on ? pill ? 'var(--blue-700)' : 'var(--text-strong)' : 'var(--text-muted)',
        background: pill ? on ? 'var(--surface-card)' : 'transparent' : 'transparent',
        borderRadius: pill ? 'var(--radius-full)' : 0,
        boxShadow: pill && on ? 'var(--shadow-sm)' : 'none',
        borderBottom: pill ? 'none' : `2px solid ${on ? 'var(--action)' : 'transparent'}`,
        transition: 'color var(--dur) var(--ease-out), background var(--dur) var(--ease-out)'
      }
    }, t.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.icon,
      size: 16
    }), t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        padding: '1px 7px',
        borderRadius: 'var(--radius-full)',
        background: on ? 'var(--blue-100)' : 'var(--neutral-200)',
        color: on ? 'var(--blue-700)' : 'var(--text-muted)'
      }
    }, t.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/clinician-dashboard/dashboard.jsx
try { (() => {
/* Heyhan — Clinician dashboard UI kit (illustrative reconstruction) */
let Button, IconButton, Input, Card, Badge, Tag, Avatar, Icon, Tabs, Alert;
function _bindDS() {
  ({
    Button,
    IconButton,
    Input,
    Card,
    Badge,
    Tag,
    Avatar,
    Icon,
    Tabs,
    Alert
  } = window.HeyhanDesignSystem_50811e || {});
}
const {
  useState
} = React;
const PATIENTS = [{
  id: 1,
  name: 'Yoosuf Ali',
  age: 54,
  mrn: 'HH-10241',
  reason: 'Hypertension follow-up',
  time: '09:00',
  status: 'checked-in',
  risk: 'moderate'
}, {
  id: 2,
  name: 'Mariyam Waheeda',
  age: 38,
  mrn: 'HH-10388',
  reason: 'Diabetes review',
  time: '09:30',
  status: 'in-room',
  risk: 'high'
}, {
  id: 3,
  name: 'Ahmed Shifaz',
  age: 29,
  mrn: 'HH-10422',
  reason: 'Annual screening',
  time: '10:00',
  status: 'scheduled',
  risk: 'low'
}, {
  id: 4,
  name: 'Aminath Naz-la',
  age: 61,
  mrn: 'HH-10105',
  reason: 'Cardiac consult',
  time: '10:30',
  status: 'scheduled',
  risk: 'high'
}, {
  id: 5,
  name: 'Ibrahim Rasheed',
  age: 45,
  mrn: 'HH-10517',
  reason: 'Lab results',
  time: '11:00',
  status: 'scheduled',
  risk: 'low'
}];
const riskTone = {
  low: 'success',
  moderate: 'warning',
  high: 'danger'
};
const statusTone = {
  'checked-in': 'brand',
  'in-room': 'accent',
  scheduled: 'neutral'
};

/* ---------- sidebar ---------- */
function Sidebar() {
  const nav = [{
    icon: 'layout-dashboard',
    label: 'Dashboard',
    on: true
  }, {
    icon: 'calendar-days',
    label: 'Schedule'
  }, {
    icon: 'users',
    label: 'Patients'
  }, {
    icon: 'flask-conical',
    label: 'Lab orders'
  }, {
    icon: 'message-square-text',
    label: 'Messages',
    badge: 4
  }, {
    icon: 'chart-line',
    label: 'Reports'
  }];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 244,
      flex: 'none',
      background: 'var(--surface-card)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '4px 8px 22px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    style: {
      width: 30,
      height: 30
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 18,
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)'
    }
  }, "Heyhan"), /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    style: {
      marginLeft: 'auto'
    }
  }, "Clinic")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, nav.map(n => /*#__PURE__*/React.createElement("a", {
    key: n.label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '10px 12px',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      fontSize: 14.5,
      fontWeight: 600,
      fontFamily: 'var(--font-display)',
      color: n.on ? 'var(--blue-700)' : 'var(--text-muted)',
      background: n.on ? 'var(--blue-50)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.icon,
    size: 19
  }), n.label, n.badge && /*#__PURE__*/React.createElement(Badge, {
    tone: "danger",
    style: {
      marginLeft: 'auto'
    }
  }, n.badge)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-sunken)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Aisha Naeem",
    status: "online",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap'
    }
  }, "Dr. A. Naeem"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, "Cardiology"))));
}

/* ---------- topbar ---------- */
function Topbar() {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 64,
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 28px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, "Today's clinic"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "Sunday, 12 July \xB7 Mal\xE9 Central")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      width: 280
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Search patients, MRN\u2026",
    size: "sm"
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    variant: "ghost",
    label: "Notifications"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    iconLeft: "plus"
  }, "New patient"));
}

/* ---------- stat cards ---------- */
function Stats() {
  const stats = [{
    label: 'Appointments',
    val: '18',
    sub: '5 completed',
    icon: 'calendar-check',
    tone: 'var(--action)',
    bg: 'var(--blue-50)'
  }, {
    label: 'Waiting',
    val: '3',
    sub: 'avg 12 min',
    icon: 'clock',
    tone: 'var(--cyan-600)',
    bg: 'var(--cyan-50)'
  }, {
    label: 'High risk',
    val: '2',
    sub: 'need review',
    icon: 'triangle-alert',
    tone: 'var(--danger)',
    bg: 'var(--danger-soft)'
  }, {
    label: 'Messages',
    val: '4',
    sub: 'unread',
    icon: 'message-square-text',
    tone: 'var(--success-strong)',
    bg: 'var(--success-soft)'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginBottom: 20
    }
  }, stats.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.label,
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      fontWeight: 600
    }
  }, s.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 30,
      color: 'var(--text-strong)',
      lineHeight: 1.1,
      marginTop: 4
    }
  }, s.val), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-subtle)',
      marginTop: 2
    }
  }, s.sub)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: s.bg,
      color: s.tone,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.icon,
    size: 20
  }))))));
}

/* ---------- patient queue ---------- */
function Queue({
  selected,
  onSelect
}) {
  return /*#__PURE__*/React.createElement(Card, {
    padding: 0,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, "Patient queue"), /*#__PURE__*/React.createElement(Tabs, {
    tabs: ['All', 'Waiting', 'Scheduled'],
    defaultValue: "All",
    variant: "pill"
  })), /*#__PURE__*/React.createElement("div", null, PATIENTS.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    onClick: () => onSelect(p),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '13px 18px',
      cursor: 'pointer',
      borderBottom: '1px solid var(--border-subtle)',
      background: selected.id === p.id ? 'var(--blue-50)' : 'transparent',
      borderLeft: `3px solid ${selected.id === p.id ? 'var(--action)' : 'transparent'}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--text-muted)',
      width: 44
    }
  }, p.time), /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 14.5,
      color: 'var(--text-strong)'
    }
  }, p.name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: 'var(--text-subtle)'
    }
  }, "\xB7 ", p.age)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, p.reason)), /*#__PURE__*/React.createElement(Badge, {
    tone: riskTone[p.risk],
    dot: true
  }, p.risk), /*#__PURE__*/React.createElement(Badge, {
    tone: statusTone[p.status]
  }, p.status)))));
}

/* ---------- patient detail ---------- */
function Detail({
  p
}) {
  const [tab, setTab] = useState('vitals');
  return /*#__PURE__*/React.createElement(Card, {
    padding: 0,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      background: 'var(--gradient-brand-soft)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 19,
      color: 'var(--text-strong)'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)'
    }
  }, p.mrn, " \xB7 ", p.age, "y \xB7 ", p.reason)), /*#__PURE__*/React.createElement(Badge, {
    tone: riskTone[p.risk],
    dot: true
  }, p.risk, " risk")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    iconLeft: "stethoscope"
  }, "Start consult"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "outline",
    iconLeft: "file-plus"
  }, "New note"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconLeft: "flask-conical"
  }, "Order lab"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      value: 'vitals',
      label: 'Vitals',
      icon: 'activity'
    }, {
      value: 'meds',
      label: 'Meds',
      count: 3
    }, {
      value: 'history',
      label: 'History'
    }],
    value: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18
    }
  }, tab === 'vitals' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 14
    }
  }, [{
    l: 'Blood pressure',
    v: '148/94',
    u: 'mmHg',
    t: 'danger'
  }, {
    l: 'Heart rate',
    v: '78',
    u: 'bpm',
    t: 'success'
  }, {
    l: 'BMI',
    v: '28.4',
    u: 'kg/m²',
    t: 'warning'
  }, {
    l: 'SpO₂',
    v: '97',
    u: '%',
    t: 'success'
  }].map(m => /*#__PURE__*/React.createElement("div", {
    key: m.l,
    style: {
      padding: 12,
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-sunken)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, m.l), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 5,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 20,
      color: m.t === 'danger' ? 'var(--danger)' : 'var(--text-strong)'
    }
  }, m.v), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-subtle)'
    }
  }, m.u))))), /*#__PURE__*/React.createElement(Alert, {
    tone: "warning",
    title: "BP above target",
    icon: "triangle-alert"
  }, "Systolic trending up over the last 3 visits. Consider medication review.")), tab === 'meds' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, ['Amlodipine 5mg · once daily', 'Metformin 500mg · twice daily', 'Atorvastatin 20mg · at night'].map(m => /*#__PURE__*/React.createElement("div", {
    key: m,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pill",
    size: 18,
    style: {
      color: 'var(--action)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, m)))), tab === 'history' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, [['12 Jun', 'Hypertension follow-up', 'Dr. Naeem'], ['02 May', 'Lab panel — HbA1c 6.8%', 'Lab'], ['14 Mar', 'Annual screening', 'Dr. Faiz']].map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12,
      padding: '10px 0',
      borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5,
      color: 'var(--text-muted)',
      width: 52
    }
  }, h[0]), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-strong)',
      fontWeight: 500
    }
  }, h[1]), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-subtle)'
    }
  }, h[2])))))));
}

/* ---------- root ---------- */
function ClinicianDashboard() {
  _bindDS();
  const [selected, setSelected] = useState(PATIENTS[1]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      width: 1280,
      height: 820,
      background: 'var(--surface-page)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xl)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Topbar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement(Stats, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Queue, {
    selected: selected,
    onSelect: setSelected
  }), /*#__PURE__*/React.createElement(Detail, {
    p: selected
  })))));
}
window.ClinicianDashboard = ClinicianDashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/clinician-dashboard/dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/site.jsx
try { (() => {
/* Heyhan — Marketing website UI kit (illustrative reconstruction) */
let Button, Card, Badge, Icon, Input;
function _bindDS() {
  ({
    Button,
    Card,
    Badge,
    Icon,
    Input
  } = window.HeyhanDesignSystem_50811e || {});
}
function Nav() {
  const links = ['Services', 'For clinics', 'About', 'Contact'];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      padding: '16px 48px',
      background: 'color-mix(in oklch, var(--surface-card) 82%, transparent)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    style: {
      width: 30,
      height: 30
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 20,
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)'
    }
  }, "Heyhan")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 26,
      marginLeft: 12
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: 'var(--text-muted)'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    iconRight: "arrow-right"
  }, "Get the app")));
}
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      padding: '84px 48px 72px',
      textAlign: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(90% 120% at 50% -10%, var(--blue-50) 0%, transparent 60%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 760,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    icon: "sparkles",
    style: {
      marginBottom: 22
    }
  }, "Clinician-led \xB7 Made in the Maldives"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 58,
      fontWeight: 800,
      letterSpacing: '-0.03em',
      lineHeight: 1.03,
      color: 'var(--text-strong)'
    }
  }, "Prevention first.", /*#__PURE__*/React.createElement("br", null), "Care that reaches ", /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--gradient-brand)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent'
    }
  }, "everyone.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 19,
      color: 'var(--text-muted)',
      lineHeight: 1.55,
      maxWidth: 560,
      margin: '20px auto 0'
    }
  }, "Heyhan connects patients across every atoll with clinicians, records and screening reminders \u2014 so care starts before illness does."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: "arrow-right"
  }, "Get started free"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "lg",
    iconLeft: "play"
  }, "Watch demo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      justifyContent: 'center',
      marginTop: 26,
      fontSize: 13.5,
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 16,
    style: {
      color: 'var(--success)'
    }
  }), " Aasandha covered"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 16,
    style: {
      color: 'var(--success)'
    }
  }), " Encrypted records"))));
}
function Stats() {
  const s = [['24', 'atolls served'], ['180+', 'clinicians'], ['65k', 'patients'], ['4.9', 'app rating']];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '0 48px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 20,
      maxWidth: 900,
      margin: '0 auto',
      padding: '32px 40px',
      background: 'var(--gradient-brand)',
      borderRadius: 'var(--radius-2xl)',
      boxShadow: 'var(--shadow-brand)'
    }
  }, s.map(([v, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      textAlign: 'center',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 40,
      letterSpacing: '-0.02em'
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      opacity: 0.9
    }
  }, l)))));
}
function Services() {
  const items = [{
    icon: 'video',
    title: 'Telehealth consults',
    body: 'Same-day video visits with licensed clinicians, from any island.'
  }, {
    icon: 'calendar-heart',
    title: 'Preventive screening',
    body: 'Personalized reminders for check-ups, vaccines and chronic-care reviews.'
  }, {
    icon: 'clipboard-list',
    title: 'Unified records',
    body: 'Every result, prescription and vital in one secure, portable record.'
  }, {
    icon: 'pill',
    title: 'Medication tracking',
    body: 'Refill reminders and adherence support that actually fits daily life.'
  }, {
    icon: 'heart-pulse',
    title: 'Chronic care',
    body: 'Connected monitoring for blood pressure, diabetes and heart health.'
  }, {
    icon: 'users',
    title: 'Family accounts',
    body: 'Manage care for children and elders from a single, simple place.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 48px 40px',
      maxWidth: 1100,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--action)',
      marginBottom: 10
    }
  }, "What we do"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 38,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)'
    }
  }, "Healthcare that works the way islands do")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 20
    }
  }, items.map(it => /*#__PURE__*/React.createElement(Card, {
    key: it.title,
    interactive: true,
    padding: 24
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 14,
      background: 'var(--surface-brand-soft)',
      color: 'var(--action)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 24
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--text-strong)',
      marginBottom: 6
    }
  }, it.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      color: 'var(--text-muted)',
      lineHeight: 1.55,
      margin: 0
    }
  }, it.body)))));
}
function Quote() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '60px 48px',
      maxWidth: 820,
      margin: '0 auto',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 30,
      lineHeight: 1.35,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, "\u201CWe built Heyhan because distance should never decide who gets good care.\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      fontSize: 14.5,
      color: 'var(--text-muted)'
    }
  }, "Dr. Aisha Naeem \xB7 Co-founder & Cardiologist"));
}
function CTA() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '40px 48px 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1000,
      margin: '0 auto',
      padding: '56px 48px',
      background: 'var(--neutral-950)',
      borderRadius: 'var(--radius-3xl)',
      display: 'flex',
      alignItems: 'center',
      gap: 40,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 260
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      color: '#fff',
      fontSize: 34,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.1
    }
  }, "Start caring, sooner."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--neutral-300)',
      fontSize: 16,
      marginTop: 12,
      lineHeight: 1.55
    }
  }, "Download the Heyhan app and book your first consult in minutes.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconLeft: "apple"
  }, "App Store"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    iconLeft: "play",
    style: {
      background: '#fff',
      color: 'var(--neutral-900)',
      boxShadow: 'none'
    }
  }, "Google Play"))));
}
function Footer() {
  const cols = [['Product', ['Patient app', 'For clinics', 'Pricing', 'Security']], ['Company', ['About', 'Careers', 'Press', 'Contact']], ['Resources', ['Help centre', 'Privacy', 'Terms']]];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      padding: '48px 48px 40px',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    style: {
      width: 26,
      height: 26
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 18,
      color: 'var(--text-strong)'
    }
  }, "Heyhan")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-muted)',
      maxWidth: 240,
      lineHeight: 1.55
    }
  }, "Prevention-first healthcare for the Maldives.")), cols.map(([h, items]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-strong)',
      marginBottom: 12
    }
  }, h), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, items.map(i => /*#__PURE__*/React.createElement("a", {
    key: i,
    style: {
      fontSize: 13.5,
      color: 'var(--text-muted)'
    }
  }, i)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: '28px auto 0',
      paddingTop: 20,
      borderTop: '1px solid var(--border-subtle)',
      fontSize: 12.5,
      color: 'var(--text-subtle)'
    }
  }, "\xA9 2026 Heyhan Healthcare Pvt Ltd \xB7 Mal\xE9, Maldives"));
}
function MarketingSite() {
  _bindDS();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1200,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xl)'
    }
  }, /*#__PURE__*/React.createElement(Nav, null), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(Stats, null), /*#__PURE__*/React.createElement(Services, null), /*#__PURE__*/React.createElement(Quote, null), /*#__PURE__*/React.createElement(CTA, null), /*#__PURE__*/React.createElement(Footer, null));
}
window.MarketingSite = MarketingSite;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/site.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens.jsx
try { (() => {
/* Heyhan — Patient mobile app UI kit (illustrative reconstruction) */
let Button, IconButton, Input, Select, Card, Badge, Tag, Avatar, Icon, Tabs, Alert, Dialog;
function _bindDS() {
  ({
    Button,
    IconButton,
    Input,
    Select,
    Card,
    Badge,
    Tag,
    Avatar,
    Icon,
    Tabs,
    Alert,
    Dialog
  } = window.HeyhanDesignSystem_50811e || {});
}
const {
  useState
} = React;

/* ---------- shared ---------- */
function StatusBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 15,
      color: 'var(--text-strong)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "signal",
    size: 16
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "wifi",
    size: 16
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "battery-full",
    size: 18
  })));
}
function Screen({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      top: 44,
      bottom: 76,
      overflowY: 'auto',
      ...style
    }
  }, children);
}
function SectionTitle({
  children,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      margin: '0 0 12px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, children), action && /*#__PURE__*/React.createElement("a", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, action));
}

/* ---------- login ---------- */
function Login({
  onLogin
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--gradient-brand)',
      padding: '80px 28px 56px',
      color: '#fff',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 60,
      borderRadius: 18,
      background: 'rgba(255,255,255,0.16)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    style: {
      width: 34,
      height: 34,
      filter: 'brightness(0) invert(1)'
    }
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#fff',
      fontSize: 30,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.1
    }
  }, "Prevention first."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 0',
      fontSize: 16,
      opacity: 0.9,
      lineHeight: 1.5
    }
  }, "Care that reaches everyone in the Maldives.")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '32px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Mobile number",
    icon: "phone",
    placeholder: "+960 ___ ____",
    defaultValue: "+960 776 1234"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Password",
    icon: "lock",
    type: "password",
    defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    iconRight: "arrow-right",
    onClick: onLogin,
    style: {
      marginTop: 4
    }
  }, "Sign in"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, "New to Heyhan? ", /*#__PURE__*/React.createElement("a", {
    style: {
      fontWeight: 600
    }
  }, "Create account"))));
}

/* ---------- home ---------- */
function Home({
  go
}) {
  return /*#__PURE__*/React.createElement(Screen, {
    style: {
      padding: '8px 20px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Yoosuf Ali",
    status: "online"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "Good morning,"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17,
      color: 'var(--text-strong)'
    }
  }, "Yoosuf"))), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    variant: "soft",
    label: "Notifications"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: 0,
    style: {
      overflow: 'hidden',
      marginBottom: 24,
      border: 'none',
      background: 'var(--gradient-brand)',
      boxShadow: 'var(--shadow-brand)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      opacity: 0.85
    }
  }, "Next appointment"), /*#__PURE__*/React.createElement(Badge, {
    tone: "solid",
    style: {
      background: 'rgba(255,255,255,0.2)',
      color: '#fff'
    }
  }, "In 2 days")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Aisha Naeem",
    size: "lg",
    ring: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17
    }
  }, "Dr. Aisha Naeem"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      opacity: 0.9
    }
  }, "Cardiology \xB7 Mal\xE9 Central"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      marginTop: 6,
      fontSize: 13.5,
      opacity: 0.95
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 14
  }), " Sun, 12 Jul \xB7 10:30"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    style: {
      background: '#fff',
      color: 'var(--blue-700)',
      boxShadow: 'none',
      flex: 1
    }
  }, "Join video"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    style: {
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.4)',
      flex: 1
    }
  }, "Reschedule")))), /*#__PURE__*/React.createElement(SectionTitle, null, "Quick actions"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 24
    }
  }, [{
    icon: 'calendar-plus',
    label: 'Book visit',
    tone: 'var(--action)',
    bg: 'var(--blue-50)',
    onClick: () => go('book')
  }, {
    icon: 'video',
    label: 'Telehealth',
    tone: 'var(--cyan-600)',
    bg: 'var(--cyan-50)'
  }, {
    icon: 'pill',
    label: 'Medications',
    tone: 'var(--success-strong)',
    bg: 'var(--success-soft)'
  }, {
    icon: 'flask-conical',
    label: 'Lab results',
    tone: 'var(--amber-700)',
    bg: 'var(--warning-soft)'
  }].map(a => /*#__PURE__*/React.createElement(Card, {
    key: a.label,
    interactive: true,
    onClick: a.onClick,
    padding: 16,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: a.bg,
      color: a.tone,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: a.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 14.5,
      color: 'var(--text-strong)'
    }
  }, a.label)))), /*#__PURE__*/React.createElement(SectionTitle, {
    action: "View all"
  }, "Your vitals"), /*#__PURE__*/React.createElement(Card, {
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 8
    }
  }, [{
    label: 'Blood pressure',
    val: '118/76',
    unit: 'mmHg',
    tone: 'success',
    ic: 'heart-pulse'
  }, {
    label: 'Heart rate',
    val: '64',
    unit: 'bpm',
    tone: 'success',
    ic: 'activity'
  }, {
    label: 'Glucose',
    val: '112',
    unit: 'mg/dL',
    tone: 'warning',
    ic: 'droplet'
  }].map(v => /*#__PURE__*/React.createElement("div", {
    key: v.label,
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: v.ic,
    size: 18,
    style: {
      color: v.tone === 'warning' ? 'var(--warning)' : 'var(--success)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 19,
      color: 'var(--text-strong)',
      marginTop: 4
    }
  }, v.val), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--text-subtle)'
    }
  }, v.unit), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, v.label))))));
}

/* ---------- book ---------- */
function Book({
  go
}) {
  const [step, setStep] = useState(0);
  const slots = ['09:00', '10:30', '11:15', '13:00', '14:30', '16:00'];
  const [slot, setSlot] = useState('10:30');
  return /*#__PURE__*/React.createElement(Screen, {
    style: {
      padding: '8px 20px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-left",
    variant: "ghost",
    label: "Back",
    onClick: () => go('home')
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, "Book a visit")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Clinic",
    placeholder: "Choose a clinic",
    options: ['Malé Central', 'Hulhumalé', 'Addu City'],
    defaultValue: "Mal\xE9 Central"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Specialty",
    options: ['General medicine', 'Cardiology', 'Pediatrics', 'Dermatology'],
    defaultValue: "Cardiology"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-strong)',
      marginBottom: 10
    }
  }, "Available times \xB7 Sun 12 Jul"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10
    }
  }, slots.map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setSlot(s),
    style: {
      padding: '12px 0',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: 15,
      fontWeight: 500,
      border: `1px solid ${slot === s ? 'transparent' : 'var(--border-default)'}`,
      background: slot === s ? 'var(--action)' : 'var(--surface-card)',
      color: slot === s ? '#fff' : 'var(--text-body)'
    }
  }, s)))), /*#__PURE__*/React.createElement(Alert, {
    tone: "info",
    title: "Covered by Aasandha"
  }, "Your national insurance covers this consultation."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    iconRight: "check",
    onClick: () => setStep(1)
  }, "Confirm \xB7 Sun 10:30")), /*#__PURE__*/React.createElement(Dialog, {
    open: step === 1,
    onClose: () => setStep(0),
    icon: "calendar-check",
    tone: "success",
    title: "Appointment booked",
    description: "Sunday 12 Jul at 10:30 with Dr. Aisha Naeem, Mal\xE9 Central. We'll remind you the day before.",
    footer: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: () => go('home')
    }, "Done")
  }));
}

/* ---------- bottom nav ---------- */
function BottomNav({
  tab,
  setTab
}) {
  const items = [{
    id: 'home',
    icon: 'house',
    label: 'Home'
  }, {
    id: 'appts',
    icon: 'calendar',
    label: 'Visits'
  }, {
    id: 'records',
    icon: 'clipboard-list',
    label: 'Records'
  }, {
    id: 'profile',
    icon: 'user',
    label: 'Profile'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 76,
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      paddingBottom: 14
    }
  }, items.map(it => {
    const on = tab === it.id || it.id === 'home' && (tab === 'home' || tab === 'book');
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => setTab(it.id === 'home' ? 'home' : it.id),
      style: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        paddingTop: 12,
        color: on ? 'var(--action)' : 'var(--text-subtle)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 22
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600
      }
    }, it.label));
  }));
}

/* ---------- placeholder tab ---------- */
function Simple({
  icon,
  title,
  note
}) {
  return /*#__PURE__*/React.createElement(Screen, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 40,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 20,
      background: 'var(--surface-brand-soft)',
      color: 'var(--action)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 30
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      color: 'var(--text-muted)',
      maxWidth: 240
    }
  }, note));
}

/* ---------- app root ---------- */
function PatientApp() {
  _bindDS();
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('home');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 390,
      height: 812,
      background: 'var(--surface-page)',
      borderRadius: 46,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xl)',
      border: '10px solid #0A0F1A'
    }
  }, !authed ? /*#__PURE__*/React.createElement(Login, {
    onLogin: () => setAuthed(true)
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBar, null), tab === 'home' && /*#__PURE__*/React.createElement(Home, {
    go: setTab
  }), tab === 'book' && /*#__PURE__*/React.createElement(Book, {
    go: setTab
  }), tab === 'appts' && /*#__PURE__*/React.createElement(Simple, {
    icon: "calendar",
    title: "Your visits",
    note: "Upcoming and past appointments would appear here."
  }), tab === 'records' && /*#__PURE__*/React.createElement(Simple, {
    icon: "clipboard-list",
    title: "Health records",
    note: "Lab results, prescriptions and vitals history in one place."
  }), tab === 'profile' && /*#__PURE__*/React.createElement(Simple, {
    icon: "user",
    title: "Yoosuf Ali",
    note: "Profile, insurance (Aasandha) and privacy settings."
  }), /*#__PURE__*/React.createElement(BottomNav, {
    tab: tab,
    setTab: setTab
  })));
}
window.PatientApp = PatientApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
