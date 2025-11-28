/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/router */ \"./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _loading__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./loading */ \"./pages/loading.js\");\n/* harmony import */ var bootstrap_scss_bootstrap_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! bootstrap/scss/bootstrap.scss */ \"./node_modules/bootstrap/scss/bootstrap.scss\");\n/* harmony import */ var bootstrap_scss_bootstrap_scss__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(bootstrap_scss_bootstrap_scss__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _public_css_plugins_feature_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../public/css/plugins/feature.css */ \"./public/css/plugins/feature.css\");\n/* harmony import */ var _public_css_plugins_feature_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_public_css_plugins_feature_css__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var _public_css_plugins_fontawesome_all_min_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../public/css/plugins/fontawesome-all.min.css */ \"./public/css/plugins/fontawesome-all.min.css\");\n/* harmony import */ var _public_css_plugins_fontawesome_all_min_css__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_public_css_plugins_fontawesome_all_min_css__WEBPACK_IMPORTED_MODULE_6__);\n/* harmony import */ var _public_css_plugins_animation_css__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../public/css/plugins/animation.css */ \"./public/css/plugins/animation.css\");\n/* harmony import */ var _public_css_plugins_animation_css__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_public_css_plugins_animation_css__WEBPACK_IMPORTED_MODULE_7__);\n/* harmony import */ var _node_modules_sal_js_dist_sal_css__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../node_modules/sal.js/dist/sal.css */ \"./node_modules/sal.js/dist/sal.css\");\n/* harmony import */ var _node_modules_sal_js_dist_sal_css__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_node_modules_sal_js_dist_sal_css__WEBPACK_IMPORTED_MODULE_8__);\n/* harmony import */ var slick_carousel_slick_slick_css__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! slick-carousel/slick/slick.css */ \"./node_modules/slick-carousel/slick/slick.css\");\n/* harmony import */ var slick_carousel_slick_slick_css__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(slick_carousel_slick_slick_css__WEBPACK_IMPORTED_MODULE_9__);\n/* harmony import */ var slick_carousel_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! slick-carousel/slick/slick-theme.css */ \"./node_modules/slick-carousel/slick/slick-theme.css\");\n/* harmony import */ var slick_carousel_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(slick_carousel_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_10__);\n/* harmony import */ var react_tooltip_dist_react_tooltip_css__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! react-tooltip/dist/react-tooltip.css */ \"./node_modules/react-tooltip/dist/react-tooltip.min.css\");\n/* harmony import */ var react_tooltip_dist_react_tooltip_css__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(react_tooltip_dist_react_tooltip_css__WEBPACK_IMPORTED_MODULE_11__);\n/* harmony import */ var _public_scss_style_scss__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../public/scss/style.scss */ \"./public/scss/style.scss\");\n/* harmony import */ var _public_scss_style_scss__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(_public_scss_style_scss__WEBPACK_IMPORTED_MODULE_12__);\n\n\n\n\n\n// ========= Plugins CSS START =========\n\n\n\n\n\n\n\n// ========= Plugins CSS END =========\n\nfunction App({ Component, pageProps }) {\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{\n        __webpack_require__(/*! bootstrap/dist/js/bootstrap.bundle.min.js */ \"bootstrap/dist/js/bootstrap.bundle.min.js\");\n        const handleStart = (url)=>url !== next_router__WEBPACK_IMPORTED_MODULE_1__.Router.asPath && setLoading(true);\n        const handleComplete = ()=>setLoading(false);\n        next_router__WEBPACK_IMPORTED_MODULE_1__.Router.events.on(\"routeChangeStart\", handleStart);\n        next_router__WEBPACK_IMPORTED_MODULE_1__.Router.events.on(\"routeChangeComplete\", handleComplete);\n        next_router__WEBPACK_IMPORTED_MODULE_1__.Router.events.on(\"routeChangeError\", handleComplete);\n        return ()=>{\n            next_router__WEBPACK_IMPORTED_MODULE_1__.Router.events.off(\"routeChangeStart\", handleStart);\n            next_router__WEBPACK_IMPORTED_MODULE_1__.Router.events.off(\"routeChangeComplete\", handleComplete);\n            next_router__WEBPACK_IMPORTED_MODULE_1__.Router.events.off(\"routeChangeError\", handleComplete);\n        };\n    }, []);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {\n        children: loading ? /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_loading__WEBPACK_IMPORTED_MODULE_3__[\"default\"], {}, void 0, false, {\n            fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\_app.js\",\n            lineNumber: 39,\n            columnNumber: 23\n        }, this) : /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\_app.js\",\n            lineNumber: 39,\n            columnNumber: 37\n        }, this)\n    }, void 0, false);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFxQztBQUNPO0FBQ1o7QUFFTztBQUV2Qyx3Q0FBd0M7QUFDRztBQUNZO0FBQ1Y7QUFDQTtBQUNMO0FBQ007QUFDQTtBQUM5QyxzQ0FBc0M7QUFFSDtBQUVwQixTQUFTSSxJQUFJLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFFO0lBQ2xELE1BQU0sQ0FBQ0MsU0FBU0MsV0FBVyxHQUFHTiwrQ0FBUUEsQ0FBQztJQUV2Q0QsZ0RBQVNBLENBQUM7UUFDUlEsbUJBQU9BLENBQUMsNEZBQTJDO1FBRW5ELE1BQU1DLGNBQWMsQ0FBQ0MsTUFBUUEsUUFBUVgsK0NBQU1BLENBQUNZLE1BQU0sSUFBSUosV0FBVztRQUNqRSxNQUFNSyxpQkFBaUIsSUFBTUwsV0FBVztRQUV4Q1IsK0NBQU1BLENBQUNjLE1BQU0sQ0FBQ0MsRUFBRSxDQUFDLG9CQUFvQkw7UUFDckNWLCtDQUFNQSxDQUFDYyxNQUFNLENBQUNDLEVBQUUsQ0FBQyx1QkFBdUJGO1FBQ3hDYiwrQ0FBTUEsQ0FBQ2MsTUFBTSxDQUFDQyxFQUFFLENBQUMsb0JBQW9CRjtRQUVyQyxPQUFPO1lBQ0xiLCtDQUFNQSxDQUFDYyxNQUFNLENBQUNFLEdBQUcsQ0FBQyxvQkFBb0JOO1lBQ3RDViwrQ0FBTUEsQ0FBQ2MsTUFBTSxDQUFDRSxHQUFHLENBQUMsdUJBQXVCSDtZQUN6Q2IsK0NBQU1BLENBQUNjLE1BQU0sQ0FBQ0UsR0FBRyxDQUFDLG9CQUFvQkg7UUFDeEM7SUFDRixHQUFHLEVBQUU7SUFFTCxxQkFBTztrQkFBR04sd0JBQVUsOERBQUNKLGdEQUFPQTs7OztpQ0FBTSw4REFBQ0U7WUFBVyxHQUFHQyxTQUFTOzs7Ozs7O0FBQzVEIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYWl3YXZlLW5leHRqczE0Ly4vcGFnZXMvX2FwcC5qcz9lMGFkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJvdXRlciB9IGZyb20gXCJuZXh0L3JvdXRlclwiO1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IExvYWRpbmcgZnJvbSBcIi4vbG9hZGluZ1wiO1xuXG5pbXBvcnQgXCJib290c3RyYXAvc2Nzcy9ib290c3RyYXAuc2Nzc1wiO1xuXG4vLyA9PT09PT09PT0gUGx1Z2lucyBDU1MgU1RBUlQgPT09PT09PT09XG5pbXBvcnQgXCIuLi9wdWJsaWMvY3NzL3BsdWdpbnMvZmVhdHVyZS5jc3NcIjtcbmltcG9ydCBcIi4uL3B1YmxpYy9jc3MvcGx1Z2lucy9mb250YXdlc29tZS1hbGwubWluLmNzc1wiO1xuaW1wb3J0IFwiLi4vcHVibGljL2Nzcy9wbHVnaW5zL2FuaW1hdGlvbi5jc3NcIjtcbmltcG9ydCBcIi4uL25vZGVfbW9kdWxlcy9zYWwuanMvZGlzdC9zYWwuY3NzXCI7XG5pbXBvcnQgXCJzbGljay1jYXJvdXNlbC9zbGljay9zbGljay5jc3NcIjtcbmltcG9ydCBcInNsaWNrLWNhcm91c2VsL3NsaWNrL3NsaWNrLXRoZW1lLmNzc1wiO1xuaW1wb3J0IFwicmVhY3QtdG9vbHRpcC9kaXN0L3JlYWN0LXRvb2x0aXAuY3NzXCI7XG4vLyA9PT09PT09PT0gUGx1Z2lucyBDU1MgRU5EID09PT09PT09PVxuXG5pbXBvcnQgXCIuLi9wdWJsaWMvc2Nzcy9zdHlsZS5zY3NzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH0pIHtcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgcmVxdWlyZShcImJvb3RzdHJhcC9kaXN0L2pzL2Jvb3RzdHJhcC5idW5kbGUubWluLmpzXCIpO1xuXG4gICAgY29uc3QgaGFuZGxlU3RhcnQgPSAodXJsKSA9PiB1cmwgIT09IFJvdXRlci5hc1BhdGggJiYgc2V0TG9hZGluZyh0cnVlKTtcbiAgICBjb25zdCBoYW5kbGVDb21wbGV0ZSA9ICgpID0+IHNldExvYWRpbmcoZmFsc2UpO1xuXG4gICAgUm91dGVyLmV2ZW50cy5vbihcInJvdXRlQ2hhbmdlU3RhcnRcIiwgaGFuZGxlU3RhcnQpO1xuICAgIFJvdXRlci5ldmVudHMub24oXCJyb3V0ZUNoYW5nZUNvbXBsZXRlXCIsIGhhbmRsZUNvbXBsZXRlKTtcbiAgICBSb3V0ZXIuZXZlbnRzLm9uKFwicm91dGVDaGFuZ2VFcnJvclwiLCBoYW5kbGVDb21wbGV0ZSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgUm91dGVyLmV2ZW50cy5vZmYoXCJyb3V0ZUNoYW5nZVN0YXJ0XCIsIGhhbmRsZVN0YXJ0KTtcbiAgICAgIFJvdXRlci5ldmVudHMub2ZmKFwicm91dGVDaGFuZ2VDb21wbGV0ZVwiLCBoYW5kbGVDb21wbGV0ZSk7XG4gICAgICBSb3V0ZXIuZXZlbnRzLm9mZihcInJvdXRlQ2hhbmdlRXJyb3JcIiwgaGFuZGxlQ29tcGxldGUpO1xuICAgIH07XG4gIH0sIFtdKTtcblxuICByZXR1cm4gPD57bG9hZGluZyA/IDxMb2FkaW5nIC8+IDogPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPn08Lz47XG59XG4iXSwibmFtZXMiOlsiUm91dGVyIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJMb2FkaW5nIiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIiwibG9hZGluZyIsInNldExvYWRpbmciLCJyZXF1aXJlIiwiaGFuZGxlU3RhcnQiLCJ1cmwiLCJhc1BhdGgiLCJoYW5kbGVDb21wbGV0ZSIsImV2ZW50cyIsIm9uIiwib2ZmIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./pages/loading.js":
/*!**************************!*\
  !*** ./pages/loading.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst Loading = ()=>{\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"preloader\",\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"loader\",\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"circle\"\n                    }, void 0, false, {\n                        fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\loading.js\",\n                        lineNumber: 8,\n                        columnNumber: 11\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"circle\"\n                    }, void 0, false, {\n                        fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\loading.js\",\n                        lineNumber: 9,\n                        columnNumber: 11\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"circle\"\n                    }, void 0, false, {\n                        fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\loading.js\",\n                        lineNumber: 10,\n                        columnNumber: 11\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"circle\"\n                    }, void 0, false, {\n                        fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\loading.js\",\n                        lineNumber: 11,\n                        columnNumber: 11\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"circle\"\n                    }, void 0, false, {\n                        fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\loading.js\",\n                        lineNumber: 12,\n                        columnNumber: 11\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\loading.js\",\n                lineNumber: 7,\n                columnNumber: 9\n            }, undefined)\n        }, void 0, false, {\n            fileName: \"D:\\\\External Projects\\\\React Projects\\\\Synthovia\\\\aiwave-nextjs-page-route\\\\pages\\\\loading.js\",\n            lineNumber: 6,\n            columnNumber: 7\n        }, undefined)\n    }, void 0, false);\n};\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Loading);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9sb2FkaW5nLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUEwQjtBQUUxQixNQUFNQyxVQUFVO0lBQ2QscUJBQ0U7a0JBQ0UsNEVBQUNDO1lBQUlDLFdBQVU7c0JBQ2IsNEVBQUNEO2dCQUFJQyxXQUFVOztrQ0FDYiw4REFBQ0Q7d0JBQUlDLFdBQVU7Ozs7OztrQ0FDZiw4REFBQ0Q7d0JBQUlDLFdBQVU7Ozs7OztrQ0FDZiw4REFBQ0Q7d0JBQUlDLFdBQVU7Ozs7OztrQ0FDZiw4REFBQ0Q7d0JBQUlDLFdBQVU7Ozs7OztrQ0FDZiw4REFBQ0Q7d0JBQUlDLFdBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUt6QjtBQUVBLGlFQUFlRixPQUFPQSxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYWl3YXZlLW5leHRqczE0Ly4vcGFnZXMvbG9hZGluZy5qcz81MzlmIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcblxuY29uc3QgTG9hZGluZyA9ICgpID0+IHtcbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcmVsb2FkZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsb2FkZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNpcmNsZVwiPjwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2lyY2xlXCI+PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjaXJjbGVcIj48L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNpcmNsZVwiPjwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2lyY2xlXCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC8+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBMb2FkaW5nO1xuIl0sIm5hbWVzIjpbIlJlYWN0IiwiTG9hZGluZyIsImRpdiIsImNsYXNzTmFtZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./pages/loading.js\n");

/***/ }),

/***/ "./public/css/plugins/animation.css":
/*!******************************************!*\
  !*** ./public/css/plugins/animation.css ***!
  \******************************************/
/***/ (() => {



/***/ }),

/***/ "./public/css/plugins/feature.css":
/*!****************************************!*\
  !*** ./public/css/plugins/feature.css ***!
  \****************************************/
/***/ (() => {



/***/ }),

/***/ "./public/css/plugins/fontawesome-all.min.css":
/*!****************************************************!*\
  !*** ./public/css/plugins/fontawesome-all.min.css ***!
  \****************************************************/
/***/ (() => {



/***/ }),

/***/ "./public/scss/style.scss":
/*!********************************!*\
  !*** ./public/scss/style.scss ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "bootstrap/dist/js/bootstrap.bundle.min.js":
/*!************************************************************!*\
  !*** external "bootstrap/dist/js/bootstrap.bundle.min.js" ***!
  \************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("bootstrap/dist/js/bootstrap.bundle.min.js");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc","vendor-chunks/slick-carousel","vendor-chunks/sal.js","vendor-chunks/react-tooltip","vendor-chunks/bootstrap"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();