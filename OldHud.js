const eLUdD_O = {
  socket: {
    sendEvent(eventName, data = {}) {
      let onResponse = () => {};

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:8159", true);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          onResponse(xhr.responseText);
        }
      };

      xhr.send(
        JSON.stringify({
          event: eventName,
          data: data,
        })
      );

      return {
        callback(fn) {
          if (typeof fn === "function") onResponse = fn;
        },
      };
    },
  },

  attemptInitialization(callback, retryDelay = 250, name = "none", tries = 0) {
    try {
      if (typeof callback !== "function") {
        throw new Error("Callback is not a function");
      }
      callback();
    } catch (error) {
      if (tries > 120) {
        return;
      }
      setTimeout(() => {
        this.attemptInitialization(callback, retryDelay, name, tries + 1);
      }, retryDelay);
    }
  },

  createStyles(cssText, id) {
    try {
      if (id && document.getElementById(id)) return;
      const style = document.createElement("style");
      if (id) style.id = id;
      style.innerHTML = cssText;
      document.head.appendChild(style);
    } catch (error) {}
  },

addNewInterfaces: {
  data: {
    hudContainer: null,
    scaler: null,
    logoContainer: null,
    isNewHudAdde: false,
    isNewSpeedometerAdded: false,
    callbacks: [],
  },

  addEventOnChangeHudInfo(callback) {
    try {
      if (!this.data.callbacks.length) {
        const hudInfo = JSON.parse(JSON.stringify(window.interface("Hud").info));
        window.interface("Hud").info = new Proxy(hudInfo, {
          set(target, key, value) {
            try {
              eLUdD_O.addNewInterfaces.data.callbacks.forEach((cb) => cb(key, value));
            } catch (error) {}
            return Reflect.set(target, key, value);
          },
        });
      }
      this.data.callbacks.push(callback);
    } catch (error) {
      console.error(error);
    }
  },

  addHudMethod(methods) {
    try {
      for (const [name, fn] of Object.entries(methods)) {
        window.interface("Hud")[name] = (...args) => fn(...args);
      }
    } catch (error) {}
  },

  addNewHud(html, className, onInfoChange) {
    if (this.data.isNewHudAdde) return;
    eLUdD_O.createStyles("body #app .hud-radmir-info {display: none !important}");
    const container = document.createElement("div");
    try {
      this.addEventOnChangeHudInfo(onInfoChange);

      this.addHudMethod({
        showGreenZoneTab: () => onInfoChange("showGreenZoneTab"),
        hideGreenZoneTab: () => onInfoChange("hideGreenZoneTab"),
        setBonus: (value) => {
          onInfoChange("setBonus", value);
          window.interface("Hud").bonus = value;
        },
        setServer: (value) => {
          onInfoChange("setServer", value);
          window.interface("Hud").server = value;
        },
        setHelloween: (value) => {
          onInfoChange("setHelloween", value);
          window.interface("Hud").isHelloween = value;
        },
        setNewYear: (value) => {
          onInfoChange("setNewYear", value);
          window.interface("Hud").isNewYear = value;
        },
      });

      container.className = className;
      container.innerHTML = html;
      this.data.hudContainer.appendChild(container);
      this.data.isNewHudAdde = true;
      return container;
    } catch (error) {
      console.error(error);
    }
    return container;
  },

  addNewSpeedometer(html, className, onInfoChange) {
    if (this.data.isNewSpeedometerAdded) return;
    try {
      eLUdD_O.createStyles("body #app .hud-radmir-speedometer {display: none !important}");

      const container = document.createElement("div");

      const speedoData = JSON.parse(
        JSON.stringify(window.interface("Hud").speedometer)
      );

      window.interface("Hud").speedometer = new Proxy(speedoData, {
        set(target, key, value) {
          try { onInfoChange(key, value); } catch (e) {}
          return Reflect.set(target, key, value);
        },
      });

      if (window.interface("Hud").speedometer.tachometer) {
        const tachoData = JSON.parse(
          JSON.stringify(window.interface("Hud").speedometer.tachometer)
        );

        window.interface("Hud").speedometer.tachometer = new Proxy(tachoData, {
          set(target, key, value) {
            try { onInfoChange(key, value); } catch (e) {}
            return Reflect.set(target, key, value);
          },
        });
      }

      container.className = className;
      container.innerHTML = html;
      this.data.hudContainer.appendChild(container);
      this.data.isNewSpeedometerAdded = true;
      return container;
    } catch (error) {}
  },

  applyScale() {
    const scaler = this.data.scaler;
    if (!scaler) return;
    const BASE_H = 1080;
    const scale = window.innerHeight / BASE_H;
    scaler.style.transform = "scale(" + scale + ")";
  },

  init() {
    try {
      this.data.hudContainer = document.createElement("div");
      this.data.hudContainer.classList.add("Hudloader_HUD-Container");
      document.body.appendChild(this.data.hudContainer);

      eLUdD_O.createStyles(`
        .Hudloader_HUD-Container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; }
        .Hudloader-scaler { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; transform-origin: top left; pointer-events: none; }
        .Hudloader-logoContainer { position: fixed; top: 2vh; right: 1.2vh; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; pointer-events: none; }
        .Hudloader-logoContainer .OLD-RADMIR-logo { position: absolute; display: block !important; right: 4vh; top: 2vh; transform-origin: top right; }
      `);

      const scaler = document.createElement("div");
      scaler.className = "Hudloader-scaler";
      this.data.hudContainer.appendChild(scaler);
      this.data.scaler = scaler;

      const logoContainer = document.createElement("div");
      logoContainer.className = "Hudloader-logoContainer";
      document.body.appendChild(logoContainer);
      this.data.logoContainer = logoContainer;

      this.applyScale();
      window.addEventListener("resize", () => this.applyScale());

      const orig = this.data.hudContainer;
      this.data.hudContainer = scaler;
      setTimeout(() => {
        this.data.hudContainer = orig;
      }, 0);
    } catch (error) {
      console.error("addNewInterfaces.init error:", error);
    }
  },
},

  speedometerAlt: {
    data: {
      jslContainer: null,
      isNewHudAdde: false,
      isNewSpeedometerAdded: false,
    },

    createSpeedometer(html, className, onInfoChange) {
      if (this.data.isNewSpeedometerAdded) return;

      eLUdD_O.createStyles(
        "body #app .hud-radmir-speedometer {display: none}"
      );

      const container = document.createElement("div");

      try {
        const speedoData = JSON.parse(
          JSON.stringify(window.interface("Hud").speedometer)
        );

        window.interface("Hud").speedometer = new Proxy(speedoData, {
          set(target, key, value) {
            onInfoChange(key, value);
            return Reflect.set(target, key, value);
          },
        });

        window.interface("Hud").speedometer.setTurnLightStatus = (side, value) => {
          onInfoChange(side ? "right" : "left", value);
        };

        if (window.interface("Hud").speedometer.tachometer) {
          const tachoData = JSON.parse(
            JSON.stringify(window.interface("Hud").speedometer.tachometer)
          );

          window.interface("Hud").speedometer.tachometer = new Proxy(tachoData, {
            set(target, key, value) {
              onInfoChange(key, value);
              return Reflect.set(target, key, value);
            },
          });

          const origShow = window.interface("Hud").speedometer.tachometer.show;
          window.interface("Hud").speedometer.tachometer.show = function (...args) {
            onInfoChange("tachometer-show", 1);
            if (typeof origShow === "function") return origShow.apply(this, args);
          };
        }

        container.className = className;
        container.innerHTML = html;
        document.body.appendChild(container);
        this.data.isNewSpeedometerAdded = true;
      } catch (error) {}

      return container;
    },
  },

  notification: {
    data: {
      wrapperElem: null,
      icons: {
        info: {
          url:
            '<svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="57" y="53" width="5" height="37" rx="2.5" fill="white"/><rect x="56" y="34" width="7" height="7" rx="3.5" fill="white"/><circle cx="60" cy="60" r="47.5" stroke="white" stroke-width="5"/></svg>',
        },
        success: {
          url:
            '<svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="47.5" stroke="white" stroke-width="5"/><path d="M40 60L55 75L80 45" stroke="white" stroke-width="5" stroke-linecap="round"/></svg>',
        },
        warning: {
          url:
            '<svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="47.5" stroke="white" stroke-width="5"/><path d="M45 45L75 75" stroke="white" stroke-width="5"/><path d="M75 45L45 75" stroke="white" stroke-width="5"/></svg>',
        },
      },
    },

    createWrapper() {
      if (!this.data.wrapperElem) {
        this.data.wrapperElem = document.createElement("div");
        this.data.wrapperElem.id = "JSL-toastWrapper";
        document.body.appendChild(this.data.wrapperElem);

        eLUdD_O.createStyles(
          "#JSL-toastWrapper{z-index:-1;-webkit-user-select:none;user-select:none;background:linear-gradient(323deg,#1f1f1f .19%,#26262600 57.93%);flex-direction:column-reverse;align-items:flex-end;width:100vw;height:100vh;padding:4vh;animation:.25s forwards fade-in;display:flex;position:absolute;bottom:0;right:0}  .JSL-content__scriptName{color:#fff;font-family:Open Sans,GothamPro,sans-serif;font-size:1.60085vh;font-style:normal;font-weight:600;line-height:2.13447vh}" +
            ".JSL-toast{box-sizing:border-box;background:#ffffff4d;border-radius:1vh;align-items:center;min-width:21vh;margin-top:3vh;padding:1.3vh;animation:.25s fade-in,.3s slide-in,.25s 2.5s forwards fade-out;display:flex}" +
            ".JSL-toast__icon{display:flex;align-items:center;margin-right:1.3vh;}" +
            ".JSL-toast__content{font-size:1.6vh;line-height:1.3; color: #ffffff}" +
            ".JSL-content__status{color:#ffffffb3;font-family:Open Sans,GothamPro,sans-serif;font-size:1.3vh;font-style:normal;font-weight:400}" +
            ".closes{animation:.3s .2s forwards fade-out!important}" +
            "@keyframes fade-in{0%{opacity:0}}@keyframes fade-out{to{opacity:0}}@keyframes slide-in{0%{transform:translateY(1vh)}}" +
            "@keyframes JSL-toast-in{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}",
          "jsl-toast-styles"
        );
      }
    },

    show(type = "info", text = "", status = "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D") {
      if (!this.data.wrapperElem) this.createWrapper();

      const toast = document.createElement("div");
      toast.className = "JSL-toast";
      toast.innerHTML = `
        <div class="JSL-toast__icon">${this.data.icons[type]?.url || ""}</div>
        <div class="JSL-toast__content">
          ${text}
          <div class="JSL-content__status">${status}</div>
        </div>
      `;
      this.data.wrapperElem.appendChild(toast);

      setTimeout(() => {
        toast.remove();
        if (this.data.wrapperElem && this.data.wrapperElem.children.length === 0) {
          this.data.wrapperElem.remove();
          this.data.wrapperElem = null;
        }
      }, 3000);
    },
  },
    hud: {
    data: {
      hudEl: null,
      moneyEl: null,
      hpEl: { value: null, progress: null },
      armourEl: { value: null, progress: null },
      hungerEl: { value: null, progress: null },
      breathEl: { wrapper: null, value: null, progress: null },
      wanted: { wrapper: null, els: [] },
      weaponEl: { ammoEl: null, icon: null },
      server: { wrapper: null, image: null },
      freeze: { wrapper: null, value: null },
      bonusEl: null,
      greenZoneEl: null,
    },

    createHud(e) {
      this.data.hudEl = e.querySelector(".OLD-RADMIR-hud");
      this.data.moneyEl = e.querySelector("#OLD-RADMIR-cash__value");
      
      [this.data.hpEl.progress, this.data.hpEl.value] = [
        e.querySelector(".OLD-RADMIR-param__health .OLD-RADMIR-progress__value"), 
        e.querySelector(".OLD-RADMIR-param__health .OLD-RADMIR-param__amount")
      ];
      
      [this.data.armourEl.progress, this.data.armourEl.value] = [
        e.querySelector(".OLD-RADMIR-param__armour .OLD-RADMIR-progress__value"), 
        e.querySelector(".OLD-RADMIR-param__armour .OLD-RADMIR-param__amount")
      ];
      
      [this.data.hungerEl.progress, this.data.hungerEl.value] = [
        e.querySelector(".OLD-RADMIR-param__hunger .OLD-RADMIR-progress__value"), 
        e.querySelector(".OLD-RADMIR-param__hunger .OLD-RADMIR-param__amount")
      ];
      
      [this.data.breathEl.wrapper, this.data.breathEl.progress, this.data.breathEl.value] = [
        e.querySelector(".OLD-RADMIR-param__breath"), 
        e.querySelector(".OLD-RADMIR-param__breath .OLD-RADMIR-progress__value"), 
        e.querySelector(".OLD-RADMIR-param__breath .OLD-RADMIR-param__amount")
      ];
      
      [this.data.wanted.wrapper, this.data.wanted.els] = [
        e.querySelector(".OLD-RADMIR-hud__wanted"), 
        e.querySelector(".OLD-RADMIR-wanted__row").children
      ];
      
      this.data.weaponEl.ammoEl = e.querySelector(".OLD-RADMIR-weapon__ammo").children;
      this.data.server.wrapper = e.querySelector(".OLD-RADMIR-logo");
      this.data.server.image = this.data.server.wrapper.children[0];
      this.data.bonusEl = e.querySelector(".OLD-RADMIR-logo__bonus");
      
      this.data.greenZoneEl = e.querySelector(".OLD-RADMIR-green-zone__main");
      this.data.weaponEl.icon = e.querySelector(".OLD-RADMIR-weapon__icon");
      this.data.freeze.wrapper = e.querySelector(".OLD-RADMIR-param__freeze");
      this.data.freeze.value = e.querySelector(".OLD-RADMIR-freeze__value");
      
      this.data.freeze.wrapper.style.display = "none";
    },

    getScale() {
      const { clientWidth, clientHeight } = document.documentElement;
      return (clientWidth + clientHeight) / 3000;
    },

    formatMoney(value) {
      return value.toString().replace(new RegExp("\\B(?=(\\d{3})+(?!\\d))", "g"), ".");
    },

    onInfoChange(key, value) {
      try {
        if (key === "isShowFreeze") {
          this.data.freeze.wrapper.style.display = value ? "" : "none";
        }
        if (key === "freeze") {
          this.data.freeze.value.style.width = "" + value + "%";
        }
        if ((key === "show" || key === "showBars") && +value >= 1) {
          this.data.hudEl.style.display = "";
          setTimeout(() => {
            if (window.interface("Hud").info.isShowFreeze) {
              this.data.freeze.wrapper.style.display = "";
            }
          }, 10);
        }
        if ((key === "show" || key === "showBars") && +value === 0) {
          this.data.hudEl.style.display = "none";
          this.data.freeze.wrapper.style.display = "none";
        }
        if (key === "weapon") {
          if (NewHudAssets.weapon && NewHudAssets.weapon[value]) {
            this.data.weaponEl.icon.src = NewHudAssets.weapon[value];
          }
          this.data.weaponEl.ammoEl[0].style.display = value >= 16 ? "" : "none";
          this.data.weaponEl.ammoEl[1].style.display = value >= 16 ? "" : "none";
        }
        if (key === "showGreenZoneTab") {
          if (this.data.greenZoneEl) this.data.greenZoneEl.style.display = "";
        }
        if (key === "hideGreenZoneTab") {
          if (this.data.greenZoneEl) this.data.greenZoneEl.style.display = "none";
        }
        if (key === "health") {
          this.data.hpEl.progress.style.width = "" + value + "%";
          this.data.hpEl.value.innerHTML = value;
        }
        if (key === "armour") {
          this.data.armourEl.progress.style.width = "" + value + "%";
          this.data.armourEl.value.innerHTML = value;
        }
        if (key === "hunger") {
          this.data.hungerEl.progress.style.width = "" + value + "%";
          this.data.hungerEl.value.innerHTML = value;
        }
        if (key === "breath") {
          this.data.breathEl.wrapper.style.display = value < 99 ? "" : "none";
          this.data.breathEl.progress.style.width = "" + value + "%";
          this.data.breathEl.value.innerHTML = value;
        }
        if (key === "money") {
          this.data.moneyEl.innerHTML = this.formatMoney(value);
        }
        if (key === "wanted") {
          this.data.wanted.wrapper.style.display = value === 0 ? "none" : "";
          for (let i = 0; i < 6; i++) {
            if ((5 - i) / value >= 1 || (5 - i === 0 && value === 0)) {
              this.data.wanted.els[i].src = NewHudAssets.icons.inactive_wanted;
              this.data.wanted.els[i].className = "OLD-RADMIR-wanted__inactive";
            } else {
              this.data.wanted.els[i].src = NewHudAssets.icons.active_wanted;
              this.data.wanted.els[i].className = "OLD-RADMIR-wanted__active";
            }
          }
        }
        if (key === "ammoInClip") {
          this.data.weaponEl.ammoEl[0].innerHTML = value;
        }
        if (key === "totalAmmo") {
          this.data.weaponEl.ammoEl[1].innerHTML = value;
        }
        if (key === "setBonus") {
          this.data.bonusEl.style.display = value <= 1 ? "none" : "";
          this.data.bonusEl.innerHTML = "x" + value;
        }
        if (key === "setServer") {
          if (value <= 0) {
            this.data.server.wrapper.style.display = "none";
            return;
          }
          if (this.data.server.wrapper.style.display === "none") {
            this.data.server.wrapper.style.display = "";
          }
          this.data.server.image.src = NewHudAssets.logo[value];
        }
      } catch (error) {}
    },

    setStyles() {
      try {
        let css = `
          @font-face { font-family: "GothamPro Light"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_light.ttf") format("truetype"); font-weight: 300; font-style: normal; }
          @font-face { font-family: "GothamPro Light Italic"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_lightitalic.ttf") format("truetype"); font-weight: 300; font-style: italic; }
          @font-face { font-family: "GothamPro Regular"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro.ttf") format("truetype"); font-weight: 400; font-style: normal; }
          @font-face { font-family: "GothamPro Italic"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_italic.ttf") format("truetype"); font-weight: 400; font-style: italic; }
          @font-face { font-family: "GothamPro Medium"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_medium.ttf") format("truetype"); font-weight: 500; font-style: normal; }
          @font-face { font-family: "GothamPro Medium Italic"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_mediumitalic.ttf") format("truetype"); font-weight: 500; font-style: italic; }
          @font-face { font-family: "GothamPro Bold"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_bold.ttf") format("truetype"); font-weight: 700; font-style: normal; }
          @font-face { font-family: "GothamPro Bold Italic"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_bolditalic.ttf") format("truetype"); font-weight: 700; font-style: italic; }
          @font-face { font-family: "GothamPro Black"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_black.ttf") format("truetype"); font-weight: 900; font-style: normal; }
          @font-face { font-family: "GothamPro Black Italic"; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/gothampro_blackitalic.ttf") format("truetype"); font-weight: 900; font-style: italic; }
          @font-face { font-family: ALSRubl; src: url("https://gitlab.com/saddasads9/Old-Card/-/raw/main/fonts/ALSRubl.ttf") format("truetype"); font-weight: 400; font-style: normal; }          
          .OLD-RADMIR-logo { position: absolute; right: 4vh; top: 3vh; transform-origin: top right; z-index: 10; }
          .OLD-RADMIR-logo__image { width: 20vh; height: 6.05vh; }
          .OLD-RADMIR-logo__bonus { background: radial-gradient(93.1% 93.1% at 126.72% 6.9%, #eb00ff 0, #eb00ff00 100%), linear-gradient(129.39deg, #f5be09 30.88%, #e9651b 98.06%); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff; font-weight: 700; position: absolute; bottom: -5px; right: -2px; border-radius: 50%; font-style: italic; font-weight: 900; } 
          .OLD-RADMIR-hud { position: relative; top: 2vh; right: 0vh; } 
          .OLD-RADMIR-weapon__back { position: absolute; right: 45px; top: 106px; } 
          .OLD-RADMIR-weapon__icon { position: absolute; right: 62px; top: 121px; } 
          .OLD-RADMIR-weapon__ammo { position: absolute; right: 90px; top: 220px; color: #fff; width: 80px; text-align: center; } 
          .OLD-RADMIR-weapon__ammo #OLD-RADMIR-ammo__in-clip { font-family: 'GothamPro Black Italic'; font-weight: 900; font-style: italic; font-size: 25px; margin-right: 32px; text-shadow: 0 0 5px #00000080; } 
          .OLD-RADMIR-weapon__ammo #OLD-RADMIR-ammo__total { font-family: 'GothamPro Light Italic'; font-weight: 300; font-style: italic; font-size: 18px; text-shadow: 0 0 5px #000000b3; margin-top: -23px; margin-left: 24px; } 
          .OLD-RADMIR-hud .OLD-RADMIR-hud__cash { position: absolute; right: 240px; top: 140px; display: inline-flex; align-items: center; } 
          .OLD-RADMIR-cash__icon { margin-right: 13px; margin-top: 1px; } 
          .OLD-RADMIR-hud__cash #OLD-RADMIR-cash__value { font-family: 'GothamPro Black Italic'; font-weight: 900; font-style: italic; color: #fff; display: inline-block; font-size: 28px; text-shadow: 0 0 5px #00000080; margin-top: -30px; margin-left: 37px; } 
          .OLD-RADMIR-hud .OLD-RADMIR-hud__params { width: 170px; position: absolute; top: 180px; right: 255px; } 
          .OLD-RADMIR-param__armour, .OLD-RADMIR-param__breath, .OLD-RADMIR-param__hunger { margin-top: 10px; } 
          .OLD-RADMIR-param { display: inline-flex; align-items: center; } 
          .OLD-RADMIR-param__icon { margin-right: 12px; } 
          .OLD-RADMIR-param__progress, .OLD-RADMIR-progress__value { width: 100px; height: 5px; background-color: #0000004d; border-radius: 5px; } 
          .OLD-RADMIR-progress__value { border-radius: 5px; } 
          .OLD-RADMIR-param__circle { position: relative; left: 95%; } 
          .OLD-RADMIR-param__health .OLD-RADMIR-param__circle { top: -44.00001%; } 
          .OLD-RADMIR-param__armour .OLD-RADMIR-param__circle { top: -47.00001%; } 
          .OLD-RADMIR-param__hunger .OLD-RADMIR-param__circle { top: -46.00001%; } 
          .OLD-RADMIR-param__breath .OLD-RADMIR-param__circle { top: -44.0001%; } 
          .OLD-RADMIR-param__amount { font-family: 'GothamPro Light Italic'; font-weight: 300; font-style: italic; margin-left: 10px; width: 35px; text-align: left; color: #fff; font-size: 18px; text-shadow: 0 0 5px #000000b3; } 
          .OLD-RADMIR-param__health .OLD-RADMIR-param__progress { margin-top: -10px; margin-left: 27.5px; } 
          .OLD-RADMIR-param__health { margin-left: 24px; margin-top: 2.7px; } 
          .OLD-RADMIR-param__health .OLD-RADMIR-progress__value { width: 50%; background-color: #ed2e2e; box-shadow: rgb(237 46 46 / .5) 0 0 5px 0; } 
          .OLD-RADMIR-param__health .OLD-RADMIR-param__amount { margin-left: 138px; margin-top: -12.4px; } 
          .OLD-RADMIR-param__armour .OLD-RADMIR-param__progress { margin-top: -10px; margin-left: 27.5px; } 
          .OLD-RADMIR-param__armour { margin-left: 15px; margin-top: 5.5px; } 
          .OLD-RADMIR-param__armour .OLD-RADMIR-param__icon { margin-right: 14px; margin-top: 7.4px; } 
          .OLD-RADMIR-param__armour .OLD-RADMIR-progress__value { width: 50%; background-color: #526ee6; box-shadow: rgb(82 110 230 / .5) 0 0 5px 0; } 
          .OLD-RADMIR-param__armour .OLD-RADMIR-param__amount { margin-left: 138px; margin-top: -12.4px; } 
          .OLD-RADMIR-param__hunger .OLD-RADMIR-param__progress { margin-top: -11.5px; margin-left: 27.5px; } 
          .OLD-RADMIR-param__hunger { margin-left: 5px; margin-top: 5.5px; } 
          .OLD-RADMIR-param__hunger .OLD-RADMIR-progress__value { width: 50%; box-shadow: hsl(26deg 100% 59% / 30%) 0 0 5px 0; background-color: #ff872e; } 
          .OLD-RADMIR-param__hunger .OLD-RADMIR-param__amount { margin-left: 138px; margin-top: -13.1px; } 
          .OLD-RADMIR-param__breath .OLD-RADMIR-param__progress { margin-top: -21px; margin-left: 42px; } 
          .OLD-RADMIR-param__breath { margin-left: -23px; margin-top: 22px; } 
          .OLD-RADMIR-param__breath .OLD-RADMIR-progress__value { width: 99%; background-color: #fff; box-shadow: rgb(255 255 255 / .5) 0 0 5px 0; } 
          .OLD-RADMIR-param__breath .OLD-RADMIR-param__amount { margin-left: 153px; margin-top: -13.1px; } 
          .OLD-RADMIR-hud__wanted { position: absolute; right: 70px; top: 250px; } 
          .OLD-RADMIR-wanted__back { position: absolute; right: 0; top: 25px; } 
          .OLD-RADMIR-wanted__row { display: flex; flex-direction: row; position: absolute; right: 15px; top: 32px; } 
          .OLD-RADMIR-wanted__row>img { height: 20.5px; width: 25px; padding: 2px 3px 2px 3px; } 
          .OLD-RADMIR-hud__wanted--always-show .OLD-RADMIR-wanted__inactive { opacity: .3; } 
          .OLD-RADMIR-green-zone__main { position: fixed; right: 147vh!important; top: 70vh!important; display: flex; align-items: center; } 
          .OLD-RADMIR-green-zone__image { margin-right: .96vh; }
          .OLD-RADMIR-green-zone__text { color: #fff; text-shadow: 3px 3px 5px #00000080; } 
          .OLD-RADMIR-green-zone__text div:first-child { font-size: 13px; font-weight: 900; text-transform: uppercase; } 
          .OLD-RADMIR-green-zone__text div:last-child { color: hsl(0deg 0% 100% / 70%); font-size: 12px; font-weight: 500; margin-top: 5px; } 
          .OLD-RADMIR-param__freeze { transform: translateY(100%); position: absolute; top: 96vh; left: 8.8vh; background: rgb(114 205 223 / .45); width: 22vh; height: .95vh; border-radius: 1vh; border: rgb(0 0 0 / .2) .2vh solid; overflow: hidden; } 
          .OLD-RADMIR-freeze__value { height: 100%; width: 0%; border-radius: .3vh; background: #72cddf; } 
          #app .hud-radmir-radar__radar-border { display: none; } #app .hud-radmir-radar__radar-border_new-year { display: none; } #app .hud-radmir-radar__radar-border_helloween { display: none; } #app .hud-radmir-radar__radar-bats { display: none; } #app .vignette { display: none; } #app .hud-hassle-map>img, #app .hud-radmir-radar__radar>img, #app .hud-radmir-wanted, #app .overlay-container, #app .scrollable-container_type_1 .scrollable-container__rail_y, #app .vignette, #app .window .modal__pattern-wrapper { display: none; }
          #app .modal-container-wrapper { border: 0; box-shadow: none; transform: scale(0.8); border-radius: 2vh; }
          #app .immortality-progress-bar .immortality-progress-bar_background, #app .immortality-progress-bar .circle-progress__svg { display: none!important; }
          #app .immortality-progress-bar .immortality-progress-bar__icon { left: -7vh!important; bottom: -2.2vh!important; }
        `;

        if (NewHudAssets?.speedometer) {
          if (NewHudAssets.speedometer.secondary?.length) {
            css += "#app .hud-radmir-speedometer-secondary {background-image: url(" + NewHudAssets.speedometer.secondary + ");}";
          }
          if (NewHudAssets.speedometer.main?.length) {
            css += "#app .hud-radmir-speedometer-main__speed {background-image: url(" + NewHudAssets.speedometer.main + ");}";
          }
        }

        this.setNewStyles(css);
        if (NewHudAssets && NewHudAssets.style) {
          this.setNewStyles(NewHudAssets.style);
        }
      } catch (error) {}
    },

    setNewStyles(cssText) {
      try {
        const style = document.createElement("style");
        style.innerHTML = cssText;
        document.head.appendChild(style);
      } catch (error) {}
    },

    init() {
      try {
        if (!NewHudAssets) {
           console.log("assets not found");
           return;
        }

        this.setStyles();

        try {
          window.interface("Hud").$.components.HudRadmir.components.HudRadar.components.HudMap.computed.tilesContainerStyle = () => {
            return { ...(this.playerIsInInterior && { display: "block" }) };
          };
        } catch (e) {}

    eLUdD_O.attemptInitialization(() => {
          const html =`
          <div class="OLD-RADMIR-hud">
            <div class="OLD-RADMIR-logo">
              <image src="${NewHudAssets.logo[0]}" class="OLD-RADMIR-logo__image">
              <div class="OLD-RADMIR-logo__bonus">x3</div>
            </div>
            <div class="OLD-RADMIR-hud__weapon">
              <image src="${NewHudAssets.icons.weapon_back}" class="OLD-RADMIR-weapon__back">
              <image src="${NewHudAssets.weapon[0]}" class="OLD-RADMIR-weapon__icon">
              <div class="OLD-RADMIR-weapon__ammo">
                <span id="OLD-RADMIR-ammo__in-clip">1</span>
                <span id="OLD-RADMIR-ammo__total">1</span>
              </div>
            </div>
            <div class="OLD-RADMIR-hud__cash">
              <image src="${NewHudAssets.icons.cash}" class="OLD-RADMIR-cash__icon">
              <span id="OLD-RADMIR-cash__value">2.000.000</span>
            </div>
            <div class="OLD-RADMIR-hud__params">
              <div class="OLD-RADMIR-param__health OLD-RADMIR-param">
                <image src="${NewHudAssets.icons.health}" class="OLD-RADMIR-param__icon">
                <div class="OLD-RADMIR-param__progress">
                  <div class="OLD-RADMIR-progress__value" style="width:100%">
                    <image src="${NewHudAssets.icons.circle}" class="OLD-RADMIR-param__circle">
                  </div>
                </div>
                <span class="OLD-RADMIR-param__amount">100</span>
              </div>
              <div class="OLD-RADMIR-param__armour OLD-RADMIR-param">
                <image src="${NewHudAssets.icons.armour}" class="OLD-RADMIR-param__icon">
                <div class="OLD-RADMIR-param__progress">
                  <div class="OLD-RADMIR-progress__value" style="width:50%">
                    <image src="${NewHudAssets.icons.circle}" class="OLD-RADMIR-param__circle">
                  </div>
                </div>
                <span class="OLD-RADMIR-param__amount">50</span>
              </div>
              <div class="OLD-RADMIR-param__hunger OLD-RADMIR-param">
                <image src="${NewHudAssets.icons.hunger}" class="OLD-RADMIR-param__icon">
                <div class="OLD-RADMIR-param__progress">
                  <div class="OLD-RADMIR-progress__value" style="width:0%">
                    <image src="${NewHudAssets.icons.circle}" class="OLD-RADMIR-param__circle">
                  </div>
                </div>
                <span class="OLD-RADMIR-param__amount">0</span>
              </div>
              <div class="OLD-RADMIR-param__breath OLD-RADMIR-param">
                <image src="${NewHudAssets.icons.breath}" class="OLD-RADMIR-param__icon">
                <div class="OLD-RADMIR-param__progress">
                  <div class="OLD-RADMIR-progress__value" style="width:99%">
                    <image src="${NewHudAssets.icons.circle}" class="OLD-RADMIR-param__circle">
                  </div>
                </div>
                <span class="OLD-RADMIR-param__amount">99</span>
              </div>
            </div>
            <div class="OLD-RADMIR-hud__wanted">
              <image src="${NewHudAssets.icons.wanted_back}" class="OLD-RADMIR-wanted__back">
              <div class="OLD-RADMIR-wanted__row">
                <image src="${NewHudAssets.icons.inactive_wanted}" class="OLD-RADMIR-wanted__inactive">
                <image src="${NewHudAssets.icons.inactive_wanted}" class="OLD-RADMIR-wanted__inactive">
                <image src="${NewHudAssets.icons.inactive_wanted}" class="OLD-RADMIR-wanted__inactive">
                <image src="${NewHudAssets.icons.active_wanted}" class="OLD-RADMIR-wanted__active">
                <image src="${NewHudAssets.icons.active_wanted}" class="OLD-RADMIR-wanted__active">
                <image src="${NewHudAssets.icons.active_wanted}" class="OLD-RADMIR-wanted__active">
              </div>
            </div>
          </div>
          <div class="OLD-RADMIR-green-zone__main">
            <image src="${NewHudAssets.icons.zone}" alt="" class="OLD-RADMIR-green-zone__image">
            <div class="OLD-RADMIR-green-zone__text">
              <div>\u0411\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0430\u044f \u0437\u043e\u043d\u0430</div>
              <div>\u0412\u044b \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u0435\u0441\u044c \u0432 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0439 \u0437\u043e\u043d\u0435.</div>
            </div>
          </div>
          <div style="display: none" class="OLD-RADMIR-param__freeze">
            <div class="OLD-RADMIR-freeze__value"></div>
          </div>
         `;
            const hudElement = eLUdD_O.addNewInterfaces.addNewHud(
              html,
              "OLD-RADMIR",
              (key, value) => this.onInfoChange(key, value)
            );

            if (!hudElement) throw new Error("addNewHud returned undefined");

            this.createHud(hudElement);

            try {
              const logoEl = hudElement.querySelector(".OLD-RADMIR-logo");
              const logoContainer = eLUdD_O.addNewInterfaces.data.logoContainer;
              if (logoEl && logoContainer) {
                logoContainer.appendChild(logoEl);
              }
            } catch (err) {}
          
            window.interface("Hud").setBonus(window.interface("Hud").bonus);
            window.interface("Hud").setServer(window.interface("Hud").server);
            window.interface("Hud").info.health = window.interface("Hud").info.health;
            window.interface("Hud").info.armour = window.interface("Hud").info.armour;
            window.interface("Hud").info.hunger = window.interface("Hud").info.hunger;
            window.interface("Hud").info.breath = window.interface("Hud").info.breath;
            window.interface("Hud").info.ammoInClip = window.interface("Hud").info.ammoInClip;
            window.interface("Hud").info.totalAmmo = window.interface("Hud").info.totalAmmo;
            window.interface("Hud").info.money = window.interface("Hud").info.money;
            window.interface("Hud").info.wanted = 0;
            window.interface("Hud").info.weapon = window.interface("Hud").info.weapon;
            window.interface("Hud").info.show = 0;
            window.interface("Hud").hideGreenZoneTab();
            window.sendChatInput("/hudscalefix");
            window.openInterface('GameText');
           eLUdD_O.notification.show("success", "Hudloader", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");
        }, 250, "Hudloader init");
      } catch (error) {
        console.error("hud.init error:", error);
      }
    },
  },
HudloaderRadar: {
  data: {
    type: "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439",
    color: null,
    radarClasses: {
      "\u041a\u0440\u0443\u0433\u043b\u044b\u0439": "radar-round",
      "\u041f\u0440\u044f\u043c\u043e\u0443\u0433\u043e\u043b\u044c\u043d\u044b\u0439": "radar-rectangular",
      "\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0439": "radar-square",
      "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439": "radar-oval",
    },
    typeMap: {
      squareradar: "\u041f\u0440\u044f\u043c\u043e\u0443\u0433\u043e\u043b\u044c\u043d\u044b\u0439",
      rectradar: "\u041f\u0440\u044f\u043c\u043e\u0443\u0433\u043e\u043b\u044c\u043d\u044b\u0439",
      roundradar: "\u041a\u0440\u0443\u0433\u043b\u044b\u0439",
      circleradar: "\u041a\u0440\u0443\u0433\u043b\u044b\u0439",
      ovalradar: "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439",
      ellipseradar: "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439",
      quadrar: "\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0439",
      quadradar: "\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0439",
    },
  },

  _parseConfig(config) {
    if (typeof config !== "string") {
      return { rawType: "", color: null };
    }
    const parts = config.split(":");
    const rawType = parts[0]?.trim().toLowerCase() || "";
    let color = null;

    if (parts[1]) {
      const colorMatch = parts[1].match(new RegExp("color=([^;]+)", "i"));
      if (colorMatch) {
        const colorParts = colorMatch[1]
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c);

        if (colorParts.length === 1) {
          color = colorParts[0];
        } else if (colorParts.length >= 2) {
          color = colorParts;
        }
      }
    }
    return { rawType, color };
  },

  _getBaseStyles() {
    return `
      body #app .hud-radmir-radar__map { transition: .3s; }
      .radar-round .hud-radmir-radar__map { border-radius: 100%; }
      .radar-oval .hud-hassle-map, .radar-rectangular .hud-hassle-map, .radar-square .hud-hassle-map { width: 32vh !important; height: 32vh !important; }
      .radar-rectangular .hud-radmir-radar__radar, .radar-square .hud-radmir-radar__radar { width: 26.3vh; border-radius: 2vh; }
      .radar-rectangular .hud-radmir-radar__map { width: 26.3vh !important; height: 16.9vh !important; overflow: hidden; display: flex; justify-content: center; align-items: center; border-radius: 2vh; }
      .radar-rectangular .hud-radmir-radar { left: 7.3vh; bottom: 4.03vh; }
      .radar-square .hud-radmir-radar { left: 7.2vh; }
      .radar-square .hud-radmir-radar__map { width: 21.9vh !important; height: 20.9vh !important; overflow: hidden; display: flex; justify-content: center; align-items: center; border-radius: 2vh; }
      .radar-oval .hud-radmir-radar__radar { width: 26.3vh; }
      .radar-oval .hud-radmir-radar__map { width: 26.3vh !important; height: 16.9vh !important; overflow: hidden; display: flex; justify-content: center; align-items: center; border-radius: 100%; }
      .radar-oval .hud-radmir-radar { left: 7.3vh; bottom: 16.03vh; }
    `;
  },

changeRadar(type = "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439", color = null) {
    try {
      if (this.data.color && !color && type === "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439") {
        return;
      }
      const radarEl = document.querySelector(".hud-radmir-radar");
      if (!radarEl) {
        return;
      }

      Object.values(this.data.radarClasses).forEach((cls) => {
        radarEl.classList.remove(cls);
      });

      const radarClass = this.data.radarClasses[type] || "radar-oval";
      radarEl.classList.add(radarClass);

      this.data.type =
        Object.keys(this.data.radarClasses).find(
          (key) => this.data.radarClasses[key] === radarClass
        ) || "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439";

      eLUdD_O.createStyles(this._getBaseStyles());

      if (type === "\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0439") {
        setTimeout(() => {
          const el = document.querySelector(".radar-square .hud-radmir-radar") || radarEl;
          if (el) {
            el.style.width = "21.9vh";
            el.style.height = "20.9vh";
          }
        }, 150);
      }

      if (type === "\u041a\u0440\u0443\u0433\u043b\u044b\u0439") {
        setTimeout(() => {
          const el = document.querySelector(".radar-oval .hud-radmir-radar") || radarEl;
          if (el) {
            el.style.width = "26.3vh";
            el.style.height = "16.9vh";
          }
        }, 150);
      }

      if (type === "\u041f\u0440\u044f\u043c\u043e\u0443\u0433\u043e\u043b\u044c\u043d\u044b\u0439") {
        setTimeout(() => {
          const el = document.querySelector(".radar-rectangular .hud-radmir-radar") || radarEl;
          if (el) {
            el.style.width = "26.3vh";
          }
        }, 150);
      }

      if (color) {
        const colors = Array.isArray(color) ? color : [color];
        const mapEl = document.querySelector(".hud-radmir-radar__map");
        if (!mapEl) {
          return;
        }

        mapEl.style.border = "";
        mapEl.style.borderImage = "";
        mapEl.style.background = "";
        mapEl.style.webkitBackgroundClip = "";
        mapEl.style.backgroundClip = "";
        mapEl.style.boxSizing = "";

        const radius = (type === "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439" || type === "\u041a\u0440\u0443\u0433\u043b\u044b\u0439") ? "100%" : "2vh";

        if (colors.length >= 2) {
          const c1 = colors[0].trim();
          const c2 = colors[1].trim();
          const wrapper = document.createElement("div");
          wrapper.className = "hudloader-radar-wrapper";
          wrapper.style.cssText =
            "display: inline-block !important; padding: 0.65vh !important; border-radius: " +
            radius +
            " !important; background: linear-gradient(to right, " +
            c1 +
            ", " +
            c2 +
            ") !important; line-height: 0 !important; overflow: hidden !important; box-sizing: border-box !important;";

          if (mapEl.parentNode) {
            mapEl.parentNode.insertBefore(wrapper, mapEl);
            wrapper.appendChild(mapEl);
          }

          mapEl.style.setProperty("border", "none", "important");
          mapEl.style.setProperty("box-shadow", "none", "important");
        } else {
          mapEl.style.border = "0.65vh solid " + colors[0].trim();
          mapEl.style.boxSizing = "border-box";
        }
        this.data.color = color;
      }

      try {
        const configData = JSON.stringify({
          type: type,
          color: color || ""
        });
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:3874/save_config", true);
        xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
        xhr.send("RadarType.json|" + configData);
      } catch (e) {}

    } catch (e) {}
  },

  init() {
    try {
      eLUdD_O.attemptInitialization(() => {
        setTimeout(() => {
          let radarType = null;
          let radarColor = null;

          const scripts = NewHudAssets?.scripts || [];
          for (const script of scripts) {
            const config = this._parseConfig(script);
            const mappedType = config.rawType ? this.data.typeMap[config.rawType] : null;

            if (mappedType) {
              radarType = mappedType;
              if (config.color) {
                radarColor = config.color;
              }
              break;
            }
          }

          if (radarType) {
            this.changeRadar(radarType, radarColor);
            if (radarType !== "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439") {
              eLUdD_O.notification.show("info", "" + radarType + " радар", "Загружен");
            }
          }
        }, 200);
      }, 250, "HudloaderRadar init");
    } catch (e) {}
  },
},

  oldInfoCard: {
    gameTextInterval: null,
    isBusinessOpen: false,

    openOldInfoCard(data, type) {
      try {
        if (typeof data === "string") {
          data = JSON.parse(data);
        }

        let houseNames = [
          "",
          "Деревенский дом",
          "Средний класс",
          "Премиум класс",
          "Элитный дом",
          "",
          "VIP класс",
          "Квартира",
        ];

        let isBusiness = type === "Business" ? 1 : 0;
        let ownerName = isBusiness === 0 ? data[1] : data[2];
        let ownerMafia = isBusiness === 0 ? data[4] : data[6];
        let businessType = isBusiness === 0 ? data[2] : data[3];
        let businessIncome = isBusiness === 0 ? data[6] : data[5];
        let taxValue = isBusiness === 0 ? data[5] : data[4];
        let classIndex =
          isBusiness === 0
            ? houseNames.indexOf(
                data[3]
                  .replace("й", "")
                  .replace("й", "")
                  .replace("+", "")
              )
            : data[1];

        data = JSON.stringify([
          isBusiness,
          ownerName,
          ownerMafia,
          businessType,
          businessIncome,
          taxValue,
          classIndex,
        ]);

        window.openInterface("InfoCard", data);

        if (ownerName.toLocaleLowerCase().includes("киоск")) {
          this.executeFunctionWhen(
            () => {
              const statusEl = window.interface("InfoCard").$el.querySelector(".biz .status");
              statusEl.classList.remove("status");
              statusEl.classList.add("text");
              statusEl.innerHTML = businessType + "<span>";
              window.interface("InfoCard").$el.querySelector(
                ".params .info-card__data-row .text"
              ).innerHTML = "Налог на продажу";
              window.interface("InfoCard").$el.querySelector(
                ".params .info-card__data-row .title"
              ).innerHTML = "" + taxValue + "%";
            },
            () => {
              return (
                window.interface("InfoCard") &&
                typeof window.interface("InfoCard").$el !== "undefined"
              );
            },
            100
          );
          return;
        }

        this.executeFunctionWhen(
          () => {
            const titleEl = window.interface("InfoCard").$el.querySelector(
              ".title .span"
            );
            titleEl.innerHTML = ownerName;
          },
          () => {
            return (
              window.interface("InfoCard") &&
              typeof window.interface("InfoCard").$el !== "undefined"
            );
          },
          100
        );
      } catch (error) {}
    },

    onCloseInterface() {
      try {
        clearInterval(this.gameTextInterval);
        window.interface("GameText").add('[3,"",500,0,0,0]');
        window.closeInterface("InfoCard");
      } catch (error) {}
    },

    hookAndReplaceNewInfoCard() {
      const self = this;
      try {
        window.App["$refs"].Appartament = [
          {
            close: () => {
              return self.onCloseInterface();
            },
          },
        ];
        window.App["$refs"].Business = [
          {
            close: () => {
              return self.onCloseInterface();
            },
          },
        ];

        window.openInterface = new Proxy(window.openInterface, {
          apply(target, thisArg, args) {
            try {
              if (args[0] === "Business") {
                self.isBusinessOpen = true;
              }
              if (args[0] === "Business" || args[0] === "Appartament") {
                window.interface("GameText").add('[3,"",3000,0,0,0]');
                self.gameTextInterval = setInterval(() => {
                  return window.interface("GameText").add('[3,"",3000,0,0,0]');
                }, 2000);

                self.openOldInfoCard(args[1], args[0]);
                return 0;
              }
            } catch (error) {}

            return Reflect.apply(target, thisArg, args);
          },
        });

        this.onKeyDown();
        eLUdD_O.notification.show(
          "info",
          "\u0421\u0442\u0430\u0440\u0430\u044f\u0020\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u0020\u0431\u0438\u0437\u043e\u0432\u002f\u0434\u043e\u043c\u043e\u0432",
          "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d"
        );
      } catch (error) {}
    },

    onKeyDown() {
      try {
        document.addEventListener("keydown", (e) => {
          if (e.repeat) {
            return;
          }
          if (this.isBusinessOpen && e.keyCode === 18) {
            window.sendClientEvent(0, "Business_OnPlayerEnter");
          }
        });
      } catch (error) {}
    },

    executeFunctionWhen(callback, condition, interval) {
      try {
        if (typeof callback !== "function" || typeof condition !== "function") {
          throw new Error("Callback or condition is not a function");
        }
        const timer = setInterval(() => {
          if (condition()) {
            callback();
            clearInterval(timer);
          }
        }, interval);
      } catch (error) {}
    },

    init() {
      if (NewHudAssets?.scripts?.includes("oldcard")) {
        this.hookAndReplaceNewInfoCard();
      }
    },
  },
    oldTablo: {
    _isActive: false,
    _isCreated: false,
    _updateInterval: null,

    _info: {
      timer: {
        value: 60,
        image:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODQiIGhlaWdodD0iMzkiIHZpZXdCb3g9IjAgMCA4NCAzOSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxyZWN0IHdpZHRoPSI3NCIgaGVpZ2h0PSI0MCIgcng9IjQiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAtMC4yNDU0NzcgMC45Njk0MDMgOS44MTkwOSAwKSIgZmlsbD0iI0M0QzRDNCIvPg0KPHJlY3Qgd2lkdGg9Ijc0IiBoZWlnaHQ9IjQwIiByeD0iNCIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIC0wLjI0NTQ3NyAwLjk2OTQwMyA5LjgxOTA5IDApIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+DQo8cGF0aCBkPSJNMjEuNDcyNiAzMi43Mzg5TDE4IDYuNDQ3NTFIMjUuOTE2MUwyNy4zNzI0IDIyLjg1NjRMMzcuNjQxIDYuNDQ3NTFINDUuODE4NUwyOC4yMzEyIDMyLjczODlIMjEuNDcyNloiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMTUiLz4NCjxwYXRoIGQ9Ik01Mi44MTA3IDMzQzQ3LjY4MjcgMzMgNDMuNjM3NSAzMS40MDg4IDQwLjY3NTEgMjguMjI2NUw0NS4zNDI3IDIzLjQxNTdDNDcuOTA2NyAyNS43Nzc2IDUwLjU5NTIgMjYuOTU4NiA1My40MDgyIDI2Ljk1ODZDNTQuMjc5NCAyNi45NTg2IDU0Ljk4ODkgMjYuNzg0NSA1NS41MzY1IDI2LjQzNjVDNTYuMDg0MiAyNi4wODg0IDU2LjM1OCAyNS42MTYgNTYuMzU4IDI1LjAxOTNDNTYuMzU4IDI0LjQ5NzIgNTYuMDg0MiAyNC4wNDk3IDU1LjUzNjUgMjMuNjc2OEM1NC45ODg5IDIzLjMwMzkgNTMuODA2NCAyMi43NjkzIDUxLjk4OTIgMjIuMDczMkM0OS42OTkgMjEuMjAzIDQ3Ljk5MzggMjAuMjMzNCA0Ni44NzM2IDE5LjE2NDRDNDUuNzUzNCAxOC4wOTUzIDQ1LjE5MzMgMTYuNjY1NyA0NS4xOTMzIDE0Ljg3NTdDNDUuMTkzMyAxMi4yOTAxIDQ2LjIzODggMTAuMTY0NCA0OC4zMjk5IDguNDk4NjJDNTAuNDIwOSA2LjgzMjg3IDUzLjA3MjEgNiA1Ni4yODM0IDZDNjAuNzE0NCA2IDY0LjI4NjYgNy4yOTI4MiA2NyA5Ljg3ODQ1TDYyLjUxOTIgMTQuODc1N0M2MC4zMDM3IDEyLjk2MTMgNTguMDAxIDEyLjAwNDEgNTUuNjExMiAxMi4wMDQxQzU0Ljc2NDkgMTIuMDA0MSA1NC4wODAzIDEyLjE3ODIgNTMuNTU3NSAxMi41MjYyQzUzLjAzNDggMTIuODc0MyA1Mi43NzM0IDEzLjMyMTggNTIuNzczNCAxMy44Njg4QzUyLjc3MzQgMTQuMzY2IDUzLjAzNDggMTQuNzc2MiA1My41NTc1IDE1LjA5OTRDNTQuMDgwMyAxNS40MjI3IDU1LjI3NTIgMTUuOTU3MiA1Ny4xNDIyIDE2LjcwM0M1OS4zODI2IDE3LjU0ODMgNjEuMDc1MyAxOC41MTggNjIuMjIwNCAxOS42MTE5QzYzLjM2NTUgMjAuNzA1OCA2My45MzgxIDIyLjE2MDIgNjMuOTM4MSAyMy45NzUxQzYzLjkzODEgMjYuNjYwMiA2Mi44OTI2IDI4LjgzNTYgNjAuODAxNSAzMC41MDE0QzU4LjczNTQgMzIuMTY3MSA1Ni4wNzE4IDMzIDUyLjgxMDcgMzNaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjE1Ii8+DQo8ZGVmcz4NCjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9IjEzNC42MDIiIHkxPSItMzEuOTExOCIgeDI9IjU1LjkyMjIiIHkyPSIxMDEuMDM0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+DQo8c3RvcCBzdG9wLWNvbG9yPSIjRjVCRTA5Ii8+DQo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNFOTY1MUIiLz4NCjwvbGluZWFyR3JhZGllbnQ+DQo8L2RlZnM+DQo8L3N2Zz4NCg==",
      },
      my: {
        name: "Северная ОПГ",
        kills: 0,
        image:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNiAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGQ9Ik0zMS4yODk2IDIuMDM4MjVDMzIuODU2MiAxLjA1NTU5IDM0LjU1NjggMS45NzgxNyAzNC4xNzMyIDMuNjAyNjZMMjkuNzg1NiAyMi4xODQ4QzI5LjUzMTEgMjMuMjYyOCAyOC44MzA4IDI0LjI5MzQgMjcuODQ4OCAyNS4wMzUzTDE2Ljc0NzQgMzMuNDIyN0MxNC44NDM3IDM0Ljg2MSAxMi4zOTE3IDM0Ljg2MSAxMS4xNjcyIDMzLjQyMjdMNC4wMjY2MyAyNS4wMzUzQzMuMzk0OTkgMjQuMjkzNCAzLjE4MTQzIDIzLjI2MjggMy40MzU5NiAyMi4xODQ4TDcuODA4OSAzLjY2NDc0QzguMTk1MTIgMi4wMjkwNSAxMC4zNTM5IDEuMTA5NjggMTEuNDQ3NiAyLjExNTFMMTMuMDkxMyAzLjYyNjEzQzEzLjY4NzEgNC4xNzM4NyAxNC43MDA0IDQuMTc5OTQgMTUuNTU5OCAzLjY0MDlMMjAuNDc1NiAwLjU1NzQ1MkMyMS4zMzQ5IDAuMDE4NDE1IDIyLjM0ODIgMC4wMjQ0Nzg0IDIyLjk0NCAwLjU3MjIyNEwyNi4yNjYxIDMuNjI2MTNDMjYuODYxOSA0LjE3Mzg3IDI3Ljg3NTIgNC4xNzk5NCAyOC43MzQ2IDMuNjQwOUwzMS4yODk2IDIuMDM4MjVaIiBmaWxsPSIjMDBDODAwIi8+DQo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyLjgyNTMgMS42NDY4M0w2LjUxNDU1IDI3Ljk1NzZMNC4wMjY2OCAyNS4wMzUzQzMuMzk1MDQgMjQuMjkzNCAzLjE4MTQ4IDIzLjI2MjggMy40MzYwMSAyMi4xODQ4TDcuODA4OTUgMy42NjQ3NEM4LjE5NTE3IDIuMDI5MDUgMTAuMzUzOSAxLjEwOTY4IDExLjQ0NzYgMi4xMTUxTDEzLjA5MTMgMy42MjYxM0MxMy42ODcyIDQuMTczODcgMTQuNzAwNCA0LjE3OTk0IDE1LjU1OTggMy42NDA5TDIwLjQ3NTYgMC41NTc0NTJDMjEuMzM1IDAuMDE4NDE1IDIyLjM0ODIgMC4wMjQ0Nzg0IDIyLjk0NDEgMC41NzIyMjRMMjYuMjY2MSAzLjYyNjEzQzI2Ljg2MiA0LjE3Mzg3IDI3Ljg3NTMgNC4xNzk5NCAyOC43MzQ2IDMuNjQwOUwzMS4yODk3IDIuMDM4MjVDMzEuODE0MyAxLjcwOTE4IDMyLjM1MzkgMS41OTM3NyAzMi44MjUzIDEuNjQ2ODNaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjI1Ii8+DQo8L3N2Zz4NCg==",
      },
      enemy: {
        name: "Центральное ОПГ",
        kills: 0,
        image:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNiAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGQ9Ik0zMS4yODk2IDIuMDM4MjVDMzIuODU2MiAxLjA1NTU5IDM0LjU1NjggMS45NzgxNyAzNC4xNzMyIDMuNjAyNjZMMjkuNzg1NiAyMi4xODQ4QzI5LjUzMTEgMjMuMjYyOCAyOC44MzA4IDI0LjI5MzQgMjcuODQ4OCAyNS4wMzUzTDE2Ljc0NzQgMzMuNDIyN0MxNC44NDM3IDM0Ljg2MSAxMi4zOTE3IDM0Ljg2MSAxMS4xNjcyIDMzLjQyMjdMNC4wMjY2MyAyNS4wMzUzQzMuMzk0OTkgMjQuMjkzNCAzLjE4MTQzIDIzLjI2MjggMy40MzU5NiAyMi4xODQ4TDcuODA4OSAzLjY2NDc0QzguMTk1MTIgMi4wMjkwNSAxMC4zNTM5IDEuMTA5NjggMTEuNDQ3NiAyLjExNTFMMTMuMDkxMyAzLjYyNjEzQzEzLjY4NzEgNC4xNzM4NyAxNC43MDA0IDQuMTc5OTQgMTUuNTU5OCAzLjY0MDlMMjAuNDc1NiAwLjU1NzQ1MkMyMS4zMzQ5IDAuMDE4NDE1IDIyLjM0ODIgMC4wMjQ0Nzg0IDIyLjk0NCAwLjU3MjIyNEwyNi4yNjYxIDMuNjI2MTNDMjYuODYxOSA0LjE3Mzg3IDI3Ljg3NTIgNC4xNzk5NCAyOC43MzQ2IDMuNjQwOUwzMS4yODk2IDIuMDM4MjVaIiBmaWxsPSIjRTY0NzNEIi8+DQo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyLjQ5NDEgMS42NDY4M0w2LjE4MzM3IDI3Ljk1NzZMMy42OTU1IDI1LjAzNTNDMy4wNjM4NiAyNC4yOTM0IDIuODUwMyAyMy4yNjI4IDMuMTA0ODMgMjIuMTg0OEw3LjQ3Nzc3IDMuNjY0NzRDNy44NjM5OSAyLjAyOTA1IDEwLjAyMjcgMS4xMDk2OCAxMS4xMTY1IDIuMTE1MUwxMi43NjAyIDMuNjI2MTNDMTMuMzU2IDQuMTczODcgMTQuMzY5MyA0LjE3OTk0IDE1LjIyODYgMy42NDA5TDIwLjE0NDQgMC41NTc0NTJDMjEuMDAzOCAwLjAxODQxNSAyMi4wMTcxIDAuMDI0NDc4NCAyMi42MTI5IDAuNTcyMjI0TDI1LjkzNSAzLjYyNjEzQzI2LjUzMDggNC4xNzM4NyAyNy41NDQxIDQuMTc5OTQgMjguNDAzNCAzLjY0MDlMMzAuOTU4NSAyLjAzODI1QzMxLjQ4MzEgMS43MDkxOCAzMi4wMjI3IDEuNTkzNzcgMzIuNDk0MSAxLjY0NjgzWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4yNSIvPg0KPC9zdmc+DQo=",
      },
    },

    _elements: {
      container: null,
      timer: null,
      kills: { my: null, enemy: null },
      names: { my: null, enemy: null },
    },

    _FormatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return (
        "" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
      );
    },

    _Show() {
      if (this._elements.container) {
        this._elements.container.style.display = "flex";
      }
    },

    _Hide() {
      if (this._elements.container) {
        this._elements.container.style.display = "none";
      }
    },

    _Create() {
      if (this._isCreated) {
        return;
      }

      this._elements.container = document.createElement("div");
      this._elements.container["id"] = "old-capture";

      const table = document.createElement("div");
      table.className = "old-capture-table";

      const myCol = document.createElement("div");
      myCol.className = "old-capture-table__col";

      this._elements.kills["my"] = document.createElement("div");
      this._elements.kills["my"].className = "old-capture-table__col-kills my";
      this._elements.kills["my"].innerHTML = "" + this._info["my"].kills;

      this._elements.names["my"] = document.createElement("div");
      this._elements.names["my"].className = "old-capture-table__col-name";
      this._elements.names["my"].innerHTML = this._info["my"].name;

      this._elements.timer = document.createElement("div");
      this._elements.timer.className = "old-capture-table__timer";
      this._elements.timer.innerHTML = this._FormatTime(this._info.timer.value);

      const enemyCol = document.createElement("div");
      enemyCol.className = "old-capture-table__col";

      this._elements.kills.enemy = document.createElement("div");
      this._elements.kills.enemy.className = "old-capture-table__col-kills";
      this._elements.kills.enemy.innerHTML = "" + this._info.enemy.kills;

      this._elements.names.enemy = document.createElement("div");
      this._elements.names.enemy.className = "old-capture-table__col-name";
      this._elements.names.enemy.innerHTML = this._info.enemy.name;

      const style = document.createElement("style");
      style.innerHTML = `
            #old-capture {
                align-items: center; 
                display: flex; 
                height: 100vh;
                justify-content: center; 
                pointer-events: none; 
                width: 100%;
            }
            #old-capture, .old-capture-table {
                position: absolute; 
                transform-origin: center top;
                font-size: 100px;
            }
            .old-capture-table {
                border-radius: 0.46vh; 
                bottom: 6vh;
                justify-content: space-between; padding: 1.85vh;
            }
            .old-capture-table, .old-capture-table__col {
                align-items: center; 
                display: flex;
            }
            .old-capture-table__col:last-child { flex-direction: row-reverse; }
            .old-capture-table__col-name {
                color: #fff; 
                font-size: 2.41vh; 
                font-style: italic;
                font-weight: 700; 
                text-transform: uppercase;
            }
            .old-capture-table__col-kills {
                align-items: center; 
                background-image: url(${this._info.enemy.image});
                background-size: cover; 
                color: #fff; 
                display: flex;
                font-size: 1.67vh; 
                font-style: italic; 
                font-weight: 700;
                height: 3.24vh; 
                justify-content: center; 
                margin: 0 0.74vh;
                transform-origin: right bottom; 
                width: 3.24vh;
            }
            .old-capture-table__col-kills.small { font-size: 1.3vh; }
            .old-capture-table__col-kills.my { 
                background-image: url(${this._info["my"].image}); 
            }
            .old-capture-table__timer {
                align-items: center; 
                background-image: url(${this._info.timer.image});
                background-size: cover; 
                color: #fff; 
                display: flex;
                font-size: 1.67vh; 
                font-style: italic; 
                font-weight: 700;
                height: 3.52vh; 
                justify-content: center; 
                margin: 0 2.41vh; 
                width: 7.78vh;
            }
            #app .capture-scoreboard { display: none !important; }
            #app .capture-scoreboard__left-side, #app .capture-scoreboard__timer, #app .capture-scoreboard__timer-bg-wrapper, #app .capture-scoreboard__right-side {
                display: none !important;
            }
        `;

      myCol.appendChild(this._elements.kills["my"]);
      myCol.appendChild(this._elements.names["my"]);
      table.appendChild(myCol);
      table.appendChild(this._elements.timer);
      enemyCol.appendChild(this._elements.kills.enemy);
      enemyCol.appendChild(this._elements.names.enemy);
      table.appendChild(enemyCol);
      this._elements.container.appendChild(table);
      document.getElementById("app")?.appendChild(this._elements.container);
      document.head.appendChild(style);

      this._Hide();
      this._isCreated = true;
    },

    _SyncTimer(seconds) {
      if (seconds !== this._info.timer.value) {
        this._info.timer.value = seconds;
        this._elements.timer.innerHTML = this._FormatTime(seconds);
      }
    },

    _SyncTeam(team, data, cache) {
      if (data?.name && data.name !== cache.name) {
        cache.name = data.name;
        this._elements.names[team].innerHTML = data.name;
      }
      if (data?.kills !== undefined && data.kills !== cache.kills) {
        cache.kills = data.kills;
        this._elements.kills[team].innerHTML = "" + data.kills;
      }
    },

    _OnUpdateInf() {
      const iface = window.interface?.("Capture");
      if (iface?.teams?.allies && iface?.teams?.enemy && iface?.seconds !== undefined) {
        this._SyncTimer(iface.seconds);
        this._SyncTeam("my", iface.teams.allies, this._info["my"]);
        this._SyncTeam("enemy", iface.teams.enemy, this._info.enemy);
      }
    },

    _StopUpdateInfo() {
      if (this._updateInterval) {
        clearInterval(this._updateInterval);
        this._updateInterval = null;
      }
    },

    _StartUpdateInfo() {
      this._StopUpdateInfo();
      this._updateInterval = setInterval(() => {
        return this._OnUpdateInf();
      }, 50);
    },

    _ApplyHooks() {
      const self = this;
      if (typeof window.openInterface === "function") {
        window.openInterface = new Proxy(window.openInterface, {
          apply(target, thisArg, args) {
            if (args[0] === "Capture") {
              self._isActive = true;
              self._StartUpdateInfo();
              self._Show();
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
      if (typeof window.closeInterface === "function") {
        window.closeInterface = new Proxy(window.closeInterface, {
          apply(target, thisArg, args) {
            if (args[0] === "Capture") {
              self._isActive = false;
              self._StopUpdateInfo();
              self._Hide();
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
      eLUdD_O.addNewInterfaces.addEventOnChangeHudInfo?.((key, value) => {
        if (self._isActive && key === "show") {
          +value === 0 ? self._Hide() : self._Show();
        }
      });
    },

    SetTeamImage(team, image) {
      this._info[team].image = image;
      if (this._isCreated && this._elements.kills[team]) {
        this._elements.kills[team].style.backgroundImage = "url(" + image + ")";
      }
    },

    SetTimerImage(image) {
      this._info.timer.image = image;
      if (this._isCreated && this._elements.timer) {
        this._elements.timer.style.backgroundImage = "url(" + image + ")";
      }
    },

    Initialize() {
      this._Create();
      this._ApplyHooks();
    },

    init() {
      if (NewHudAssets?.scripts?.includes("NewTablo")) {
        return;
      }
      this.Initialize();
      eLUdD_O.notification.show("info", "OldCaptureInterface", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");
    },
  },
    CustomTablo: {
    _isActive: false,
    _isCreated: false,
    _updateInterval: null,

    _info: {
      timer: { value: 60, image: "" },
      my: { name: "Северная ОПГ", kills: 0, image: "" },
      enemy: { name: "Центральное ОПГ", kills: 0, image: "" },
    },

    _elements: {
      container: null,
      timer: null,
      kills: { my: null, enemy: null },
      names: { my: null, enemy: null },
    },

    _FormatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return (
        "" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
      );
    },

    _Show() {
      if (this._elements.container) {
        this._elements.container.style.display = "flex";
      }
    },

    _Hide() {
      if (this._elements.container) {
        this._elements.container.style.display = "none";
      }
    },

    _Create() {
      if (this._isCreated) {
        return;
      }

      this._elements.container = document.createElement("div");
      this._elements.container["id"] = "old-capture";

      const table = document.createElement("div");
      table.className = "old-capture-table";

      const myCol = document.createElement("div");
      myCol.className = "old-capture-table__col";

      this._elements.kills["my"] = document.createElement("div");
      this._elements.kills["my"].className = "old-capture-table__col-kills my";
      this._elements.kills["my"].innerHTML = "" + this._info["my"].kills;

      this._elements.names["my"] = document.createElement("div");
      this._elements.names["my"].className = "old-capture-table__col-name";
      this._elements.names["my"].innerHTML = this._info["my"].name;

      this._elements.timer = document.createElement("div");
      this._elements.timer.className = "old-capture-table__timer";
      this._elements.timer.innerHTML = this._FormatTime(this._info.timer.value);

      const enemyCol = document.createElement("div");
      enemyCol.className = "old-capture-table__col";

      this._elements.kills.enemy = document.createElement("div");
      this._elements.kills.enemy.className = "old-capture-table__col-kills";
      this._elements.kills.enemy.innerHTML = "" + this._info.enemy.kills;

      this._elements.names.enemy = document.createElement("div");
      this._elements.names.enemy.className = "old-capture-table__col-name";
      this._elements.names.enemy.innerHTML = this._info.enemy.name;

      const style = document.createElement("style");
      style.innerHTML = `
            #old-capture {
                align-items: center; 
                display: flex; 
                height: 100vh;
                justify-content: center; 
                pointer-events: none; 
                width: 100%;
            }
            #old-capture, .old-capture-table {
                position: absolute; 
                transform-origin: center top;
                font-size: 100px;
            }
            .old-capture-table {
                background: rgba(0, 0, 0, 0.4) !important;
                border-radius: 25px; 
                bottom: 6vh;
                justify-content: space-between; padding: 1.85vh;
            }
            .old-capture-table, .old-capture-table__col {
                align-items: center; 
                display: flex;
            }
            .old-capture-table__col:last-child { flex-direction: row-reverse; }
            .old-capture-table__col-name {
                color: #fff; 
                font-size: 2.41vh; 
                font-style: italic;
                font-weight: 700; 
                text-transform: uppercase;
            }
            .old-capture-table__col-kills {
                align-items: center; 
                background-size: cover; 
                color: #fff; 
                display: flex;
                font-size: 1.67vh; 
                font-style: italic; 
                font-weight: 700;
                height: 3.24vh; 
                justify-content: center; 
                margin: 0 0.74vh;
                transform-origin: right bottom; 
                width: 3.24vh;
            }
            .old-capture-table__col-kills.small { font-size: 1.3vh; }
            .old-capture-table__timer {
                align-items: center; 
                background-size: cover; 
                color: #fff;
                border-radius: 15px;
                background: rgba(0, 0, 0, 0.24) !important;
                display: flex;
                font-size: 1.67vh; 
                font-style: italic; 
                font-weight: 700;
                height: 3.52vh; 
                justify-content: center; 
                margin: 0 2.41vh; 
                width: 7.78vh;
            }
            #app .capture-scoreboard { display: none !important; }
            #app .capture-scoreboard__left-side, #app .capture-scoreboard__timer, #app .capture-scoreboard__timer-bg-wrapper, #app .capture-scoreboard__right-side {
                display: none !important;
            }
        `;

      myCol.appendChild(this._elements.kills["my"]);
      myCol.appendChild(this._elements.names["my"]);
      table.appendChild(myCol);
      table.appendChild(this._elements.timer);
      enemyCol.appendChild(this._elements.kills.enemy);
      enemyCol.appendChild(this._elements.names.enemy);
      table.appendChild(enemyCol);
      this._elements.container.appendChild(table);
      document.getElementById("app")?.appendChild(this._elements.container);
      document.head.appendChild(style);

      this._Hide();
      this._isCreated = true;
    },

    _SyncTimer(seconds) {
      if (seconds !== this._info.timer.value) {
        this._info.timer.value = seconds;
        this._elements.timer.innerHTML = this._FormatTime(seconds);
      }
    },

    _SyncTeam(team, data, cache) {
      if (data?.name && data.name !== cache.name) {
        cache.name = data.name;
        this._elements.names[team].innerHTML = data.name;
      }
      if (data?.kills !== undefined && data.kills !== cache.kills) {
        cache.kills = data.kills;
        this._elements.kills[team].innerHTML = "" + data.kills;
      }
    },

    _OnUpdateInf() {
      const iface = window.interface?.("Capture");
      if (iface?.teams?.allies && iface?.teams?.enemy && iface?.seconds !== undefined) {
        this._SyncTimer(iface.seconds);
        this._SyncTeam("my", iface.teams.allies, this._info["my"]);
        this._SyncTeam("enemy", iface.teams.enemy, this._info.enemy);
      }
    },

    _StopUpdateInfo() {
      if (this._updateInterval) {
        clearInterval(this._updateInterval);
        this._updateInterval = null;
      }
    },

    _StartUpdateInfo() {
      this._StopUpdateInfo();
      this._updateInterval = setInterval(() => {
        return this._OnUpdateInf();
      }, 50);
    },

    _ApplyHooks() {
      const self = this;
      if (typeof window.openInterface === "function") {
        window.openInterface = new Proxy(window.openInterface, {
          apply(target, thisArg, args) {
            if (args[0] === "Capture") {
              self._isActive = true;
              self._StartUpdateInfo();
              self._Show();
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
      if (typeof window.closeInterface === "function") {
        window.closeInterface = new Proxy(window.closeInterface, {
          apply(target, thisArg, args) {
            if (args[0] === "Capture") {
              self._isActive = false;
              self._StopUpdateInfo();
              self._Hide();
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
      eLUdD_O.addNewInterfaces.addEventOnChangeHudInfo?.((key, value) => {
        if (self._isActive && key === "show") {
          +value === 0 ? self._Hide() : self._Show();
        }
      });
    },

    Initialize() {
      this._Create();
      this._ApplyHooks();
    },

    init() {
      if (NewHudAssets?.scripts?.includes("CustomTabloCapture")) {
        this.Initialize();
        eLUdD_O.notification.show("info", "CustomTabloCapture", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");
      }
    },
  },

  SampOldTablo: {
    _isActive: false,
    _isCreated: false,
    _updateInterval: null,

    _info: {
      timer: {
        value: 60,
        image:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODQiIGhlaWdodD0iMzkiIHZpZXdCb3g9IjAgMCA4NCAzOSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxyZWN0IHdpZHRoPSI3NCIgaGVpZ2h0PSI0MCIgcng9IjQiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAtMC4yNDU0NzcgMC45Njk0MDMgOS44MTkwOSAwKSIgZmlsbD0iI0M0QzRDNCIvPg0KPHJlY3Qgd2lkdGg9Ijc0IiBoZWlnaHQ9IjQwIiByeD0iNCIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIC0wLjI0NTQ3NyAwLjk2OTQwMyA5LjgxOTA5IDApIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+DQo8cGF0aCBkPSJNMjEuNDcyNiAzMi43Mzg5TDE4IDYuNDQ3NTFIMjUuOTE2MUwyNy4zNzI0IDIyLjg1NjRMMzcuNjQxIDYuNDQ3NTFINDUuODE4NUwyOC4yMzEyIDMyLjczODlIMjEuNDcyNloiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMTUiLz4NCjxwYXRoIGQ9Ik01Mi44MTA3IDMzQzQ3LjY4MjcgMzMgNDMuNjM3NSAzMS40MDg4IDQwLjY3NTEgMjguMjI2NUw0NS4zNDI3IDIzLjQxNTdDNDcuOTA2NyAyNS43Nzc2IDUwLjU5NTIgMjYuOTU4NiA1My40MDgyIDI2Ljk1ODZDNTQuMjc5NCAyNi45NTg2IDU0Ljk4ODkgMjYuNzg0NSA1NS41MzY1IDI2LjQzNjVDNTYuMDg0MiAyNi4wODg0IDU2LjM1OCAyNS42MTYgNTYuMzU4IDI1LjAxOTNDNTYuMzU4IDI0LjQ5NzIgNTYuMDg0MiAyNC4wNDk3IDU1LjUzNjUgMjMuNjc2OEM1NC45ODg5IDIzLjMwMzkgNTMuODA2NCAyMi43NjkzIDUxLjk4OTIgMjIuMDczMkM0OS42OTkgMjEuMjAzIDQ3Ljk5MzggMjAuMjMzNCA0Ni44NzM2IDE5LjE2NDRDNDUuNzUzNCAxOC4wOTUzIDQ1LjE5MzMgMTYuNjY1NyA0NS4xOTMzIDE0Ljg3NTdDNDUuMTkzMyAxMi4yOTAxIDQ2LjIzODggMTAuMTY0NCA0OC4zMjk5IDguNDk4NjJDNTAuNDIwOSA2LjgzMjg3IDUzLjA3MjEgNiA1Ni4yODM0IDZDNjAuNzE0NCA2IDY0LjI4NjYgNy4yOTI4MiA2NyA5Ljg3ODQ1TDYyLjUxOTIgMTQuODc1N0M2MC4zMDM3IDEyLjk2MTMgNTguMDAxIDEyLjAwNDEgNTUuNjExMiAxMi4wMDQxQzU0Ljc2NDkgMTIuMDA0MSA1NC4wODAzIDEyLjE3ODIgNTMuNTU3NSAxMi41MjYyQzUzLjAzNDggMTIuODc0MyA1Mi43NzM0IDEzLjMyMTggNTIuNzczNCAxMy44Njg4QzUyLjc3MzQgMTQuMzY2IDUzLjAzNDggMTQuNzc2MiA1My41NTc1IDE1LjA5OTRDNTQuMDgwMyAxNS40MjI3IDU1LjI3NTIgMTUuOTU3MiA1Ny4xNDIyIDE2LjcwM0M1OS4zODI2IDE3LjU0ODMgNjEuMDc1MyAxOC41MTggNjIuMjIwNCAxOS42MTE5QzYzLjM2NTUgMjAuNzA1OCA2My45MzgxIDIyLjE2MDIgNjMuOTM4MSAyMy45NzUxQzYzLjkzODEgMjYuNjYwMiA2Mi44OTI2IDI4LjgzNTYgNjAuODAxNSAzMC41MDE0QzU4LjczNTQgMzIuMTY3MSA1Ni4wNzE4IDMzIDUyLjgxMDcgMzNaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjE1Ii8+DQo8ZGVmcz4NCjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9IjEzNC42MDIiIHkxPSItMzEuOTExOCIgeDI9IjU1LjkyMjIiIHkyPSIxMDEuMDM0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+DQo8c3RvcCBzdG9wLWNvbG9yPSIjRjVCRTA5Ii8+DQo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNFOTY1MUIiLz4NCjwvbGluZWFyR3JhZGllbnQ+DQo8L2RlZnM+DQo8L3N2Zz4NCg==",
      },
      my: {
        name: "Северная ОПГ",
        kills: 0,
        image:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNiAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGQ9Ik0zMS4yODk2IDIuMDM4MjVDMzIuODU2MiAxLjA1NTU5IDM0LjU1NjggMS45NzgxNyAzNC4xNzMyIDMuNjAyNjZMMjkuNzg1NiAyMi4xODQ4QzI5LjUzMTEgMjMuMjYyOCAyOC44MzA4IDI0LjI5MzQgMjcuODQ4OCAyNS4wMzUzTDE2Ljc0NzQgMzMuNDIyN0MxNC44NDM3IDM0Ljg2MSAxMi4zOTE3IDM0Ljg2MSAxMS4xNjcyIDMzLjQyMjdMNC4wMjY2MyAyNS4wMzUzQzMuMzk0OTkgMjQuMjkzNCAzLjE4MTQzIDIzLjI2MjggMy40MzU5NiAyMi4xODQ4TDcuODA4OSAzLjY2NDc0QzguMTk1MTIgMi4wMjkwNSAxMC4zNTM5IDEuMTA5NjggMTEuNDQ3NiAyLjExNTFMMTMuMDkxMyAzLjYyNjEzQzEzLjY4NzEgNC4xNzM4NyAxNC43MDA0IDQuMTc5OTQgMTUuNTU5OCAzLjY0MDlMMjAuNDc1NiAwLjU1NzQ1MkMyMS4zMzQ5IDAuMDE4NDE1IDIyLjM0ODIgMC4wMjQ0Nzg0IDIyLjk0NCAwLjU3MjIyNEwyNi4yNjYxIDMuNjI2MTNDMjYuODYxOSA0LjE3Mzg3IDI3Ljg3NTIgNC4xNzk5NCAyOC43MzQ2IDMuNjQwOUwzMS4yODk2IDIuMDM4MjVaIiBmaWxsPSIjMDBDODAwIi8+DQo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyLjgyNTMgMS42NDY4M0w2LjUxNDU1IDI3Ljk1NzZMNC4wMjY2OCAyNS4wMzUzQzMuMzk1MDQgMjQuMjkzNCAzLjE4MTQ4IDIzLjI2MjggMy40MzYwMSAyMi4xODQ4TDcuODA4OTUgMy42NjQ3NEM4LjE5NTE3IDIuMDI5MDUgMTAuMzUzOSAxLjEwOTY4IDExLjQ0NzYgMi4xMTUxTDEzLjA5MTMgMy42MjYxM0MxMy42ODcyIDQuMTczODcgMTQuNzAwNCA0LjE3OTk0IDE1LjU1OTggMy42NDA5TDIwLjQ3NTYgMC41NTc0NTJDMjEuMzM1IDAuMDE4NDE1IDIyLjM0ODIgMC4wMjQ0Nzg0IDIyLjk0NDEgMC41NzIyMjRMMjYuMjY2MSAzLjYyNjEzQzI2Ljg2MiA0LjE3Mzg3IDI3Ljg3NTMgNC4xNzk5NCAyOC43MzQ2IDMuNjQwOUwzMS4yODk3IDIuMDM4MjVDMzEuODE0MyAxLjcwOTE4IDMyLjM1MzkgMS41OTM3NyAzMi44MjUzIDEuNjQ2ODNaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjI1Ii8+DQo8L3N2Zz4NCg==",
      },
      enemy: {
        name: "Центральное ОПГ",
        kills: 0,
        image:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNiAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGQ9Ik0zMS4yODk2IDIuMDM4MjVDMzIuODU2MiAxLjA1NTU5IDM0LjU1NjggMS45NzgxNyAzNC4xNzMyIDMuNjAyNjZMMjkuNzg1NiAyMi4xODQ4QzI5LjUzMTEgMjMuMjYyOCAyOC44MzA4IDI0LjI5MzQgMjcuODQ4OCAyNS4wMzUzTDE2Ljc0NzQgMzMuNDIyN0MxNC44NDM3IDM0Ljg2MSAxMi4zOTE3IDM0Ljg2MSAxMS4xNjcyIDMzLjQyMjdMNC4wMjY2MyAyNS4wMzUzQzMuMzk0OTkgMjQuMjkzNCAzLjE4MTQzIDIzLjI2MjggMy40MzU5NiAyMi4xODQ4TDcuODA4OSAzLjY2NDc0QzguMTk1MTIgMi4wMjkwNSAxMC4zNTM5IDEuMTA5NjggMTEuNDQ3NiAyLjExNTFMMTMuMDkxMyAzLjYyNjEzQzEzLjY4NzEgNC4xNzM4NyAxNC43MDA0IDQuMTc5OTQgMTUuNTU5OCAzLjY0MDlMMjAuNDc1NiAwLjU1NzQ1MkMyMS4zMzQ5IDAuMDE4NDE1IDIyLjM0ODIgMC4wMjQ0Nzg0IDIyLjk0NCAwLjU3MjIyNEwyNi4yNjYxIDMuNjI2MTNDMjYuODYxOSA0LjE3Mzg3IDI3Ljg3NTIgNC4xNzk5NCAyOC43MzQ2IDMuNjQwOUwzMS4yODk2IDIuMDM4MjVaIiBmaWxsPSIjRTY0NzNEIi8+DQo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyLjQ5NDEgMS42NDY4M0w2LjE4MzM3IDI3Ljk1NzZMMy42OTU1IDI1LjAzNTNDMy4wNjM4NiAyNC4yOTM0IDIuODUwMyAyMy4yNjI4IDMuMTA0ODMgMjIuMTg0OEw3LjQ3Nzc3IDMuNjY0NzRDNy44NjM5OSAyLjAyOTA1IDEwLjAyMjcgMS4xMDk2OCAxMS4xMTY1IDIuMTE1MUwxMi43NjAyIDMuNjI2MTNDMTMuMzU2IDQuMTczODcgMTQuMzY5MyA0LjE3OTk0IDE1LjIyODYgMy42NDA5TDIwLjE0NDQgMC41NTc0NTJDMjEuMDAzOCAwLjAxODQxNSAyMi4wMTcxIDAuMDI0NDc4NCAyMi42MTI5IDAuNTcyMjI0TDI1LjkzNSAzLjYyNjEzQzI2LjUzMDggNC4xNzM4NyAyNy41NDQxIDQuMTc5OTQgMjguNDAzNCAzLjY0MDlMMzAuOTU4NSAyLjAzODI1QzMxLjQ4MzEgMS43MDkxOCAzMi4wMjI3IDEuNTkzNzcgMzIuNDk0MSAxLjY0NjgzWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4yNSIvPg0KPC9zdmc+DQo=",
      },
    },

    _elements: {
      container: null,
      timer: null,
      kills: { my: null, enemy: null },
      names: { my: null, enemy: null },
    },

    _FormatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return (
        "" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
      );
    },

    _Show() {
      if (this._elements.container) {
        this._elements.container.style.display = "flex";
      }
    },

    _Hide() {
      if (this._elements.container) {
        this._elements.container.style.display = "none";
      }
    },

    _Create() {
      if (this._isCreated) {
        return;
      }

      this._elements.container = document.createElement("div");
      this._elements.container["id"] = "old-capture";

      const table = document.createElement("div");
      table.className = "old-capture-table";

      const myCol = document.createElement("div");
      myCol.className = "old-capture-table__col";

      this._elements.kills["my"] = document.createElement("div");
      this._elements.kills["my"].className = "old-capture-table__col-kills my";
      this._elements.kills["my"].innerHTML = "" + this._info["my"].kills;

      this._elements.names["my"] = document.createElement("div");
      this._elements.names["my"].className = "old-capture-table__col-name";
      this._elements.names["my"].innerHTML = this._info["my"].name;

      this._elements.timer = document.createElement("div");
      this._elements.timer.className = "old-capture-table__timer";
      this._elements.timer.innerHTML = this._FormatTime(this._info.timer.value);

      const enemyCol = document.createElement("div");
      enemyCol.className = "old-capture-table__col";

      this._elements.kills.enemy = document.createElement("div");
      this._elements.kills.enemy.className = "old-capture-table__col-kills";
      this._elements.kills.enemy.innerHTML = "" + this._info.enemy.kills;

      this._elements.names.enemy = document.createElement("div");
      this._elements.names.enemy.className = "old-capture-table__col-name";
      this._elements.names.enemy.innerHTML = this._info.enemy.name;

      const style = document.createElement("style");
      style.innerHTML = `
            #old-capture {
                align-items: center; 
                display: flex; 
                height: 100vh;
                justify-content: center; 
                pointer-events: none; 
                width: 100%;
            }
            #old-capture, .old-capture-table {
                position: absolute; 
                transform-origin: center top;
                font-size: 100px;
            }
            .old-capture-table {
                border-radius: 0.46vh; 
                bottom: 6vh;
                justify-content: space-between; padding: 1.85vh;
            }
            .old-capture-table, .old-capture-table__col {
                align-items: center; 
                display: flex;
            }
            .old-capture-table__col:last-child { flex-direction: row-reverse; }
            .old-capture-table__col-name {
                color: #fff; 
                font-size: 2.41vh; 
                font-style: italic;
                font-weight: 700; 
                text-transform: uppercase;
            }
            .old-capture-table__col-kills {
                align-items: center; 
                background-size: cover; 
                color: #fff; 
                display: flex;
                font-size: 1.67vh; 
                font-style: italic; 
                font-weight: 700;
                height: 3.24vh; 
                justify-content: center; 
                margin: 0 0.74vh;
                transform-origin: right bottom; 
                width: 3.24vh;
            }
            .old-capture-table__timer {
                align-items: center; 
                background-size: cover; 
                color: #fff; 
                display: flex;
                font-size: 1.67vh; 
                font-style: italic; 
                font-weight: 700;
                height: 3.52vh; 
                justify-content: center; 
                margin: 0 2.41vh; 
                width: 7.78vh;
            }
            #app .capture-scoreboard { display: none !important; }
            #app .capture-scoreboard__left-side, #app .capture-scoreboard__timer, #app .capture-scoreboard__timer-bg-wrapper, #app .capture-scoreboard__right-side {
                display: none !important;
            }

  #app .old-capture-table {
    flex-direction: column !important;
    min-width: 35vh !important;
    background: rgba(0, 0, 0, .8) !important;
    padding: 1.5vh 2vh !important;
    padding-top: 3.6vh !important;
    border-radius: .46vh !important;
    box-shadow: none !important;
    align-items: flex-start !important;
    left: 2.5vh !important;
    bottom: 28vh !important
}

#app .old-capture-table__col-name,
#app .old-capture-table__col-kills,
#app .old-capture-table__col-kills.my,
#app .old-capture-table__timer {
    width: auto !important;
    height: auto !important;
    font-family: 'Open Sans', sans-serif !important;
    font-weight: 700 !important;
    background: 0 0 !important;
    padding: 0 !important
}

#app .old-capture-table__col-kills,
#app .old-capture-table__col-kills.my {
    margin: 0 !important
}

#app .old-capture-table__col {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    height: 3vh !important;
    flex-basis: 100% !important;
    justify-content: space-between !important;
    flex-direction: row-reverse !important
}

#app .old-capture-table__col-kills {
    color: #b8303a !important;
    font-size: 2.5vh !important;
    font-style: normal !important
}

#app .old-capture-table__col-name {
    font-style: normal !important;
    font-size: 2vh !important;
    margin-right: 3vh !important
}

#app .old-capture-table__timer {
    color: #26a62b !important;
    font-style: normal !important;
    font-size: 2.5vh !important;
    position: absolute !important;
    top: .5vh !important;
    left: -.5vh !important
}
       `;

      myCol.appendChild(this._elements.kills["my"]);
      myCol.appendChild(this._elements.names["my"]);
      table.appendChild(myCol);
      table.appendChild(this._elements.timer);
      enemyCol.appendChild(this._elements.kills.enemy);
      enemyCol.appendChild(this._elements.names.enemy);
      table.appendChild(enemyCol);
      this._elements.container.appendChild(table);
      document.getElementById("app")?.appendChild(this._elements.container);
      document.head.appendChild(style);

      this._Hide();
      this._isCreated = true;
    },

    _SyncTimer(seconds) {
      if (seconds !== this._info.timer.value) {
        this._info.timer.value = seconds;
        this._elements.timer.innerHTML = this._FormatTime(seconds);
      }
    },

    _SyncTeam(team, data, cache) {
      if (data?.name && data.name !== cache.name) {
        cache.name = data.name;
        this._elements.names[team].innerHTML = data.name;
      }
      if (data?.kills !== undefined && data.kills !== cache.kills) {
        cache.kills = data.kills;
        this._elements.kills[team].innerHTML = "" + data.kills;
      }
    },

    _OnUpdateInf() {
      const iface = window.interface?.("Capture");
      if (iface?.teams?.allies && iface?.teams?.enemy && iface?.seconds !== undefined) {
        this._SyncTimer(iface.seconds);
        this._SyncTeam("my", iface.teams.allies, this._info["my"]);
        this._SyncTeam("enemy", iface.teams.enemy, this._info.enemy);
      }
    },

    _StopUpdateInfo() {
      if (this._updateInterval) {
        clearInterval(this._updateInterval);
        this._updateInterval = null;
      }
    },

    _StartUpdateInfo() {
      this._StopUpdateInfo();
      this._updateInterval = setInterval(() => {
        return this._OnUpdateInf();
      }, 50);
    },

    _ApplyHooks() {
      const self = this;
      if (typeof window.openInterface === "function") {
        window.openInterface = new Proxy(window.openInterface, {
          apply(target, thisArg, args) {
            if (args[0] === "Capture") {
              self._isActive = true;
              self._StartUpdateInfo();
              self._Show();
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
      if (typeof window.closeInterface === "function") {
        window.closeInterface = new Proxy(window.closeInterface, {
          apply(target, thisArg, args) {
            if (args[0] === "Capture") {
              self._isActive = false;
              self._StopUpdateInfo();
              self._Hide();
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
      eLUdD_O.addNewInterfaces.addEventOnChangeHudInfo?.((key, value) => {
        if (self._isActive && key === "show") {
          +value === 0 ? self._Hide() : self._Show();
        }
      });
    },

    Initialize() {
      this._Create();
      this._ApplyHooks();
    },

    init() {
      if (NewHudAssets?.scripts?.includes("SampTabloStyle")) {
        this.Initialize();
        eLUdD_O.notification.show("info", "SampTabloStyle", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");
      }
    },
  },

  OLDCapturetables: {
    _isActive: false,
    _isCreated: false,
    _updateInterval: null,

    _info: {
      timer: { value: 60 },
      my: { name: "Северная ОПГ", kills: 0 },
      enemy: { name: "Центральное ОПГ", kills: 0 },
    },

    _elements: {
      container: null,
      timer: null,
      kills: { my: null, enemy: null },
      names: { my: null, enemy: null },
    },

    _FormatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return (
        "" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
      );
    },

    _Show() {
      if (this._elements.container) {
        this._elements.container.style.display = "flex";
      }
    },

    _Hide() {
      if (this._elements.container) {
        this._elements.container.style.display = "none";
      }
    },

    _Create() {
      if (this._isCreated) {
        return;
      }

      this._elements.container = document.createElement("div");
      this._elements.container["id"] = "old-capture";

      const table = document.createElement("div");
      table.className = "old-capture-table";

      const myCol = document.createElement("div");
      myCol.className = "old-capture-table__col";

      this._elements.kills["my"] = document.createElement("div");
      this._elements.kills["my"].className = "old-capture-table__col-kills my";
      this._elements.kills["my"].innerHTML = "" + this._info["my"].kills;

      this._elements.names["my"] = document.createElement("div");
      this._elements.names["my"].className = "old-capture-table__col-name";
      this._elements.names["my"].innerHTML = this._info["my"].name;

      this._elements.timer = document.createElement("div");
      this._elements.timer.className = "old-capture-table__timer";
      this._elements.timer.innerHTML = this._FormatTime(this._info.timer.value);

      const enemyCol = document.createElement("div");
      enemyCol.className = "old-capture-table__col";

      this._elements.kills.enemy = document.createElement("div");
      this._elements.kills.enemy.className = "old-capture-table__col-kills";
      this._elements.kills.enemy.innerHTML = "" + this._info.enemy.kills;

      this._elements.names.enemy = document.createElement("div");
      this._elements.names.enemy.className = "old-capture-table__col-name";
      this._elements.names.enemy.innerHTML = this._info.enemy.name;

      const style = document.createElement("style");
      style.innerHTML = `
            #old-capture {
                align-items: center; 
                display: flex; 
                height: 100vh;
                justify-content: center; 
                pointer-events: none; 
                width: 100%;
            }
            #old-capture, .old-capture-table {
                position: absolute; 
                transform-origin: center top;
                font-size: 100px;
            }
            .old-capture-table {
                border-radius: 0.46vh; 
                bottom: 6vh;
                justify-content: space-between; padding: 1.85vh;
            }
            .old-capture-table, .old-capture-table__col {
                align-items: center; 
                display: flex;
            }
            .old-capture-table__col:last-child { flex-direction: row-reverse; }
            .old-capture-table__col-name {
                color: #fff; 
                font-size: 2.41vh; 
                font-style: italic;
                font-weight: 700; 
                text-transform: uppercase;
            }
            .old-capture-table__col-kills {
                align-items: center; 
                background-size: cover; 
                color: #fff; 
                display: flex;
                font-size: 1.67vh; 
                font-style: italic; 
                font-weight: 700;
                height: 3.24vh; 
                justify-content: center; 
                margin: 0 0.74vh;
                transform-origin: right bottom; 
                width: 3.24vh;
            }
            .old-capture-table__timer {
                align-items: center; 
                background-size: cover; 
                color: #fff; 
                display: flex;
                font-size: 1.67vh; 
                font-style: italic; 
                font-weight: 700;
                height: 3.52vh; 
                justify-content: center; 
                margin: 0 2.41vh; 
                width: 7.78vh;
            }
            #app .capture-scoreboard { display: none !important; }
            #app .capture-scoreboard__left-side, #app .capture-scoreboard__timer, #app .capture-scoreboard__timer-bg-wrapper, #app .capture-scoreboard__right-side {
                display: none !important;
            }

#app .old-capture-table {
    bottom: 32vh;
    left: 4vh;
    background: 0 0;
    background-color: #00000080;
    border-radius: 0;
    align-items: flex-start;
    flex-direction: column;
    padding: 3.4vh 2vh 1vh;
}
#app .old-capture-table__col-name,
#app .old-capture-table__col-kills,
#app .old-capture-table__col-kills.my,
#app .old-capture-table__timer {
    text-shadow:
        0 -0.1852vh 0 #000,
        0 -0.1852vh 0 #000,
        0 0.1852vh 0 #000,
        0 0.1852vh 0 #000,
        -0.1852vh 0 0 #000,
        0.1852vh 0 0 #000,
        -0.1852vh 0 0 #000,
        0.1852vh 0 0 #000,
        -0.0926vh -0.1852vh 0 #000,
        0.0926vh -0.1852vh 0 #000,
        -0.0926vh 0.1852vh 0 #000,
        0.0926vh 0.1852vh 0 #000,
        -0.1852vh -0.0926vh 0 #000,
        0.1852vh -0.0926vh 0 #000,
        -0.1852vh 0.0926vh 0 #000,
        0.1852vh 0.0926vh 0 #000;
}
#app .old-capture-table__col {
    flex-direction: row-reverse;
}
#app .old-capture-table__col-kills {
    font-style: normal !important;
    color: red !important;
    font-size: 2.4vh !important;
    width: auto !important;
    height: auto !important;
}
#app .old-capture-table__col-name,
#app .old-capture-table__timer {
    font-style: normal !important;
    font-size: 2vh !important;
    font-weight: 800 !important;
}
#app .old-capture-table__col-name {
    color: #dcdddf !important;
}
#app .old-capture-table__timer {
    position: absolute;
    bottom: 7.3vh;
    left: 2.7vh;
    color: #09bb09 !important;
}
#app .old-capture-table__timer:before {
    content: "Время:";
    margin-right: 0.8333vh;
}
#app .old-capture-table__col-kills,
#app .old-capture-table__col-kills.my,
#app .old-capture-table__timer {
    background-image: none !important;
}
        `;

      myCol.appendChild(this._elements.kills["my"]);
      myCol.appendChild(this._elements.names["my"]);
      table.appendChild(myCol);
      table.appendChild(this._elements.timer);
      enemyCol.appendChild(this._elements.kills.enemy);
      enemyCol.appendChild(this._elements.names.enemy);
      table.appendChild(enemyCol);
      this._elements.container.appendChild(table);
      document.getElementById("app")?.appendChild(this._elements.container);
      document.head.appendChild(style);

      this._Hide();
      this._isCreated = true;
    },

    _SyncTimer(seconds) {
      if (seconds !== this._info.timer.value) {
        this._info.timer.value = seconds;
        this._elements.timer.innerHTML = this._FormatTime(seconds);
      }
    },

    _SyncTeam(team, data, cache) {
      if (data?.name && data.name !== cache.name) {
        cache.name = data.name;
        this._elements.names[team].innerHTML = data.name;
      }
      if (data?.kills !== undefined && data.kills !== cache.kills) {
        cache.kills = data.kills;
        this._elements.kills[team].innerHTML = "" + data.kills;
      }
    },

    _OnUpdateInf() {
      const iface = window.interface?.("Capture");
      if (iface?.teams?.allies && iface?.teams?.enemy && iface?.seconds !== undefined) {
        this._SyncTimer(iface.seconds);
        this._SyncTeam("my", iface.teams.allies, this._info["my"]);
        this._SyncTeam("enemy", iface.teams.enemy, this._info.enemy);
      }
    },

    _StopUpdateInfo() {
      if (this._updateInterval) {
        clearInterval(this._updateInterval);
        this._updateInterval = null;
      }
    },

    _StartUpdateInfo() {
      this._StopUpdateInfo();
      this._updateInterval = setInterval(() => {
        return this._OnUpdateInf();
      }, 50);
    },

    _ApplyHooks() {
      const self = this;
      if (typeof window.openInterface === "function") {
        window.openInterface = new Proxy(window.openInterface, {
          apply(target, thisArg, args) {
            if (args[0] === "Capture") {
              self._isActive = true;
              self._StartUpdateInfo();
              self._Show();
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
      if (typeof window.closeInterface === "function") {
        window.closeInterface = new Proxy(window.closeInterface, {
          apply(target, thisArg, args) {
            if (args[0] === "Capture") {
              self._isActive = false;
              self._StopUpdateInfo();
              self._Hide();
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }
      eLUdD_O.addNewInterfaces.addEventOnChangeHudInfo?.((key, value) => {
        if (self._isActive && key === "show") {
          +value === 0 ? self._Hide() : self._Show();
        }
      });
    },

    Initialize() {
      this._Create();
      this._ApplyHooks();
    },

    init() {
      if (NewHudAssets?.scripts?.includes("OLDCapturetables")) {
        this.Initialize();
        eLUdD_O.notification.show("info", "OLDCapturetables", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");
      }
    },
  },
    voice: {
    init() {
      try {
        const enabled = NewHudAssets?.scripts?.includes("voice");
        const css =
          "\n        #app .voice-chat,\n        #app .voice-chat_controls {\n          display:" +
          (enabled ? "flex" : "none") +
          " !important;\n        }\n      ";
        eLUdD_O.createStyles(css);
      } catch (error) {}
    },
  },

  hudToggle: {
    state: 0,

    init() {
      try {
        document.addEventListener("keydown", (e) => {
          if (e.keyCode === 118) {
            e.preventDefault();
            this.state++;

            const elements = [
              document.querySelector(".OLD-RADMIR-hud"),
              document.querySelector(".OLD-RADMIR-logo"),
              document.querySelector(".OLD-RADMIR-logo__bonus"),
              document.querySelector(".OLD-RADMIR-green-zone__main"),
              ...document.querySelectorAll(
                ".OLD-RADMIR-weapon__back, .OLD-RADMIR-weapon__icon, .OLD-RADMIR-weapon__ammo," +
                  ".OLD-RADMIR-hud__cash, .OLD-RADMIR-hud__params, .OLD-RADMIR-hud__wanted"
              ),
            ].filter((el) => el !== null);

            if (this.state === 1) {
            } else if (this.state === 2) {
              elements.forEach((el) => {
                el.style.opacity = "0";
                el.style.pointerEvent = "none";
                el.style.transition = "opacity 0.2s ease";
              });
            } else if (this.state === 3) {
              elements.forEach((el) => {
                el.style.opacity = "1";
                el.style.pointerEvent = "all";
              });
              this.state = 0;
            }
          }
        });
      } catch (error) {}
    },
  },

  Oldzz: {
    styles: `
#app .OLD-RADMIR-green-zone__text,
.OLD-RADMIR-green-zone__text div:first-child, 
.OLD-RADMIR-green-zone__text div:last-child {
    display: none;
}
  `,

    applyImageStyles() {
      document.querySelectorAll(".OLD-RADMIR-green-zone__image").forEach((el) => {
        el.style.height = "7vh";
        el.style.width = "15vh";
        el.style.marginRight = "1vh";
        el.style.marginLeft = "-2vh";
        el.style.objectFit = "contain";
      });
    },

    init() {
      try {
        if (NewHudAssets?.scripts?.includes("ZZ")) {
          eLUdD_O.createStyles(this.styles);
          setTimeout(() => {
            return this.applyImageStyles();
          }, 100);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },

dialog: {
  data: {
    type: "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439",
    color: null,
    lastSave: null,
    useLocalStorage: false,
    _notifiedLocal: false,
  },

  _getRadarConfig: function () {
    if (typeof NewHudAssets === "undefined") {
      NewHudAssets = {};
    }
    if (!NewHudAssets.radar) {
      NewHudAssets.radar = { type: "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439", color: null };
    }
    if (this.data.type !== "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439" || this.data.color !== null) {
      NewHudAssets.radar = {
        type: this.data.type,
        color: this.data.color,
      };
    }
    return NewHudAssets.radar;
  },

  init: function () {
    var self = this;
    this.loadConfig(function (config) {
      if (
        typeof eLUdD_O.HudloaderRadar !== "undefined" &&
        typeof eLUdD_O.HudloaderRadar.changeRadar === "function"
      ) {
        eLUdD_O.HudloaderRadar.changeRadar(config.type, config.color);
      }
      self._applyRadarStyles(config.type, config.color);
    });
  },

  saveConfig: function (callback) {
    var self = this;

    if (!callback) {
      callback = function () {};
    }

    var done = function (ok) {
      self.data.lastSave = Date.now();
      callback(ok);
    };

    try {
      if (NewHudAssets) {
        if (!NewHudAssets.radar) NewHudAssets.radar = {};
        NewHudAssets.radar.type = self.data.type;
        NewHudAssets.radar.color = self.data.color;
      }

      var json = JSON.stringify(self.data);

      eLUdD_O.socket
        .sendEvent("writeFile", {
          file: "RadarType.json",
          data: json,
        })
        .callback(function (res) {
          if (res instanceof Error || !res || res === "Error") {
            self._saveToLocalStorage(callback);
          } else {
            self.data.useLocalStorage = false;
            self.data._notifiedLocal = false;
            done(true);
          }
        });
    } catch (e) {
      self._saveToLocalStorage(callback);
    }
  },

  loadConfig: function (callback) {
    var self = this;

    if (!callback) {
      callback = function () {};
    }

    var fallback = function () {
      try {
        if (typeof localStorage !== "undefined") {
          var raw = localStorage.getItem("Hudloader_RadarType");
          if (raw) {
            var parsed = JSON.parse(raw);
            self.data = Object.assign({}, self.data, parsed);
            self.data.useLocalStorage = true;
            callback(self.data);
            return;
          }
        }
      } catch (e) {}
      callback(self.data);
    };

    eLUdD_O.socket
      .sendEvent("readFile", { file: "RadarType.json" })
      .callback(function (res) {
        try {
          if (res instanceof Error || !res || res.trim() === "") {
            fallback();
          } else {
            var parsed = JSON.parse(res);
            self.data = Object.assign({}, self.data, parsed);
            self.data.useLocalStorage = false;
            self.data._notifiedLocal = false;
            callback(self.data);
          }
        } catch (e) {
          fallback();
        }
      });
  },

showRadarTypeDialog: function () {
  var self = this;
  var options = [
    "\u041a\u0440\u0443\u0433\u043b\u044b\u0439",
    "\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0439",
    "\u041f\u0440\u044f\u043c\u043e\u0443\u0433\u043e\u043b\u044c\u043d\u044b\u0439",
    "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439",
    "\u0426\u0432\u0435\u0442"
  ];
  var content = options.join("<n>");

  eLUdD_O.RadmirDialog.show({
    title: "Hudloader Radar",
    subtitle: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0438\u043f \u0440\u0430\u0434\u0430\u0440\u0430:",
    type: "list",
    content: content,
    btn1: "\u0412\u044b\u0431\u0440\u0430\u0442\u044c",
    btn2: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
    onBtn1: function (selected) {
      try {
        var value = selected;
        if (typeof selected === "string") {
          value = selected.replace(new RegExp("<[^>]*>", "g"), "").trim();
        }

        var idx = options.indexOf(value);
        if (idx === -1) {
          for (var i = 0; i < options.length; i++) {
            if (options[i] === value) { idx = i; break; }
          }
        }
        if (idx === -1) {
          for (var i = 0; i < options.length; i++) {
            if (value.indexOf(options[i].charAt(0)) === 0) { idx = i; break; }
          }
        }

        if (idx >= 0 && idx <= 3) {
          self.data.type = options[idx];
          self.saveConfig();
          if (typeof eLUdD_O.HudloaderRadar !== "undefined" &&
              typeof eLUdD_O.HudloaderRadar.changeRadar === "function") {
            eLUdD_O.HudloaderRadar.changeRadar(options[idx], self.data.color);
          }
          self._applyRadarStyles(options[idx], self.data.color);
        } else if (idx === 4) {
          setTimeout(function () {
            eLUdD_O.dialog.showRadarColorDialog();
          }, 400);
        }
      } catch (error) {
        console.error("Radar Type Error:", error);
      }
    },
    onBtn2: function () {}
  });
},

showRadarColorDialog: function () {
  var self = this;

  eLUdD_O.RadmirDialog.show({
    title: "Hudloader Radar Color",
    subtitle: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0446\u0432\u0435\u0442 (\u043d\u0430\u043f\u0440\u0438\u043c\u0435\u0440, \u0431\u0435\u0437 #, 0099ff \u0438\u043b\u0438 \u0443\u0431\u0440\u0430\u0442\u044c 0099ff00):",
    type: "input",
    content: "",
    btn1: "\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c",
    btn2: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
    onBtn1: function (value) {
      try {
        var color = value ? value.trim() : "";
        if (color && color[0] !== "#") color = "#" + color;
        if (color) {
          self.data.color = color;
          self.saveConfig();
          if (typeof eLUdD_O.HudloaderRadar !== "undefined" &&
              typeof eLUdD_O.HudloaderRadar.changeRadar === "function") {
            eLUdD_O.HudloaderRadar.changeRadar(self.data.type, color);
          }
          self._applyRadarStyles(self.data.type, color);
        }
      } catch (error) {
        console.error("Radar Color Error:", error);
      }
    },
    onBtn2: function () {}
  });
},

  _applyRadarStyles: function (type, color) {
    try {
      var radarType = type || this.data.type;
      var radarColor = color || this.data.color;
      var css =
        "body #app .hud-radmir-radar__map { transition: .3s !important; outline: none !important; box-sizing: border-box !important; margin: 0 !important; padding: 0 !important; }" +
        ".radar-round .hud-radmir-radar__map { border-radius: 100% !important; }" +
        ".radar-oval .hud-hassle-map, .radar-rectangular .hud-hassle-map, .radar-square .hud-hassle-map { width: 32vh !important; height: 32vh !important; }" +
        ".radar-rectangular .hud-radmir-radar__radar, .radar-square .hud-radmir-radar__radar { width: 26.3vh !important; border-radius: 2vh !important; }" +
        ".radar-rectangular .hud-radmir-radar__map { width: 26.3vh !important; height: 16.9vh !important; overflow: hidden !important; display: flex !important; justify-content: center !important; align-items: center !important; border-radius: 2vh !important; }" +
        ".radar-rectangular .hud-radmir-radar { left: 7.3vh !important; bottom: 4.03vh !important; }" +
        ".radar-square .hud-radmir-radar { left: 7.2vh !important; }" +
        ".radar-square .hud-radmir-radar__map { width: 21.9vh !important; height: 20.9vh !important; overflow: hidden !important; display: flex !important; justify-content: center !important; align-items: center !important; border-radius: 2vh !important; }" +
        ".radar-oval .hud-radmir-radar__radar { width: 26.3vh !important; }" +
        ".radar-oval .hud-radmir-radar__map { width: 26.3vh !important; height: 16.9vh !important; overflow: hidden !important; display: flex !important; justify-content: center !important; align-items: center !important; border-radius: 100% !important; }" +
        ".radar-oval .hud-radmir-radar { left: 7.3vh !important; bottom: 16.03vh !important; }";

      if (typeof eLUdD_O.createStyles === "function") {
        eLUdD_O.createStyles(css);
      }

      var self = this;
      var apply = function () {
        var radarEl = document.querySelector(".hud-radmir-radar");
        var mapEl = document.querySelector(".hud-radmir-radar__map");

        if (!radarEl || !mapEl) {
          return false;
        }

        [
          "radar-round",
          "radar-rectangular",
          "radar-square",
          "radar-oval",
        ].forEach(function (cls) {
          radarEl.classList.remove(cls);
        });

        var classMap = {
          "\u041a\u0440\u0443\u0433\u043b\u044b\u0439": "radar-round",
          "\u041f\u0440\u044f\u043c\u043e\u0443\u0433\u043e\u043b\u044c\u043d\u044b\u0439": "radar-rectangular",
          "\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0439": "radar-square",
          "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439": "radar-oval",
        };

        radarEl.classList.add(classMap[radarType] || "radar-oval");

        var wrapper = mapEl.closest
          ? mapEl.closest(".hudloader-radar-wrapper")
          : null;
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.replaceChild(mapEl, wrapper);
        }

        [
          "margin",
          "padding",
          "boxSizing",
          "borderRadius",
          "left",
          "bottom",
          "width",
          "height",
          "overflow",
          "display",
          "justifyContent",
          "alignItems",
          "boxShadow",
          "border",
        ].forEach(function (prop) {
          mapEl.style[prop] = "";
          if (["left", "bottom"].indexOf(prop) !== -1) {
            radarEl.style[prop] = "";
          }
        });

        if (radarType === "\u041a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u044b\u0439" || radarType === "\u041a\u0440\u0443\u0433\u043b\u044b\u0439") {
          radarEl.style.setProperty("left", "7.2vh", "important");
          radarEl.style.setProperty("bottom", "3vh", "important");
        }

        if (radarColor) {
          var colors = Array.isArray(radarColor) ? radarColor : [radarColor];
          var isRound = radarType === "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439" || radarType === "\u041a\u0440\u0443\u0433\u043b\u044b\u0439";
          var radius = isRound ? "100%" : "2vh";
          mapEl.style.setProperty("borderRadius", radius, "important");

          if (colors.length >= 2) {
            var c1 = colors[0].trim();
            var c2 = colors[1].trim();
            var wrapper2 = document.createElement("div");
            wrapper2.className = "hudloader-radar-wrapper";
            wrapper2.style.cssText =
              "display: inline-block !important; padding: 0.65vh !important; border-radius: " +
              radius +
              " !important; background: linear-gradient(to right, " +
              c1 +
              ", " +
              c2 +
              ") !important; line-height: 0 !important; overflow: hidden !important; box-sizing: border-box !important;";

            if (mapEl.parentNode) {
              mapEl.parentNode.insertBefore(wrapper2, mapEl);
              wrapper2.appendChild(mapEl);
            }

            mapEl.style.setProperty("border", "none", "important");
            mapEl.style.setProperty("box-shadow", "none", "important");
          } else {
            var c = colors[0].trim();
            mapEl.style.setProperty("border", "0.65vh solid " + c, "important");
            mapEl.style.setProperty("box-sizing", "border-box", "important");
            mapEl.style.setProperty("box-shadow", "none", "important");
          }
        } else {
          mapEl.style.setProperty("box-shadow", "none", "important");
          mapEl.style.setProperty("border", "none", "important");
        }
        return true;
      };

      if (!apply()) {
        setTimeout(apply, 100);
      }
    } catch (e) {}
  },

  createDialog: function (
    dialogId,
    title,
    subtitle,
    btn1,
    btn2,
    extra,
    onBtn1,
    onBtn2
  ) {
    if (typeof dialogId === "undefined") dialogId = 0;
    if (typeof title === "undefined") title = "Test";
    if (typeof subtitle === "undefined") subtitle = "test2";
    if (typeof btn1 === "undefined") btn1 = "Выбрать";
    if (typeof btn2 === "undefined") btn2 = "Закрыть";
    if (typeof extra === "undefined") extra = "Test";
    if (typeof onBtn1 === "undefined") onBtn1 = function () {};
    if (typeof onBtn2 === "undefined") onBtn2 = function () {};

    if (eLUdD_O.data.dialog.originalSendClientEvent == null) {
      eLUdD_O.data.dialog.originalSendClientEvent = window.sendClientEvent;
      eLUdD_O.data.dialog.originalAddDialogInQueue = window.addDialogInQueue;

      window.sendClientEvent = new Proxy(window.sendClientEvent, {
        apply: function (target, thisArg, args) {
          try {
            if (
              Array.isArray(args) &&
              args.indexOf("OnDialogResponse") !== -1 &&
              window.isFakeDialog
            ) {
              window.sendClientEvent = eLUdD_O.data.dialog.originalSendClientEvent;
              eLUdD_O.data.dialog.originalSendClientEvent = null;
              window.addDialogInQueue = eLUdD_O.data.dialog.originalAddDialogInQueue;
              eLUdD_O.data.dialog.originalAddDialogInQueue = null;

              if (args[3] == 0) {
                onBtn2();
              }
              if (args[3] == 1) {
                var text = args[5]
                  .replace('<p style="color: #>', "")
                  .replace("</p>", "");
                onBtn1(text);
              }
              return false;
            }
          } catch (err) {}

          return Reflect.apply(target, thisArg, args);
        },
      });

      window.addDialogInQueue = new Proxy(window.addDialogInQueue, {
        apply: function (target, thisArg, args) {
          if (
            args.length > 1 &&
            args[1] &&
            args[1].indexOf("HudloaderDialog") !== -1
          ) {
            args[1] = args[1].replace("HudloaderDialog", "");
            window.isFakeDialog = true;
            return Reflect.apply(target, thisArg, args);
          } else {
            window.isFakeDialog = false;
            window.sendClientEvent = eLUdD_O.data.dialog.originalSendClientEvent;
            eLUdD_O.data.dialog.originalSendClientEvent = null;
            window.addDialogInQueue = eLUdD_O.data.dialog.originalAddDialogInQueue;
            eLUdD_O.data.dialog.originalAddDialogInQueue = null;
            return Reflect.apply(target, thisArg, args);
          }
        },
      });
    }

    window.addDialogInQueue(
      '[0,' +
        dialogId +
        ',"' +
        title +
        '","' +
        subtitle +
        '","' +
        btn1 +
        '","' +
        btn2 +
        '",0,0]',
      "HudloaderDialog" + extra,
      0
    );
  },
},

  chat: {
    _registeredCommands: {},

    registerCommand: function (cmd, handler) {
      if (typeof window.sendChatInput !== "function") {
        return;
      }

      if (Object.keys(this._registeredCommands).length === 0) {
        var original = window.sendChatInput;
        var self = this;

        window.sendChatInput = new Proxy(original, {
          apply: function (target, thisArg, args) {
            var input = args.map(String).join("").trim();
            if (!input) return target.apply(thisArg, args);

            var parts = input.split(new RegExp("\\s+", ""));
            var cmdName = parts[0];
            var cmdArgs = parts.slice(1);

            if (self._registeredCommands[cmdName]) {
              try {
                var result = self._registeredCommands[cmdName](cmdArgs);
                if (result === 0) return;
              } catch (error) {}
            }
            return target.apply(thisArg, args);
          },
        });
      }
      this._registeredCommands[cmd] = handler;
    },

    addChatMessage: function (author, text) {
      var iface = window.interface("Hud");
      if (
        iface &&
        iface["$refs"] &&
        iface["$refs"].chat &&
        typeof iface["$refs"].chat.add === "function"
      ) {
        iface["$refs"].chat.add(author, text);
      }
    },

    init: function () {
      if (typeof eLUdD_O.dialog?.init === "function") {
        eLUdD_O.dialog.init();
      }

      if (
        NewHudAssets &&
        NewHudAssets.scripts &&
        NewHudAssets.scripts.indexOf("RadarType") !== -1
      ) {
        eLUdD_O.notification.show("info", "RadarType", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");

        this.registerCommand(
          "/radartype",
          function () {
            eLUdD_O.dialog.showRadarTypeDialog();
          }.bind(this)
        );

        this.registerCommand(
          "/radarcolor",
          function () {
            eLUdD_O.dialog.showRadarColorDialog();
          }.bind(this)
        );

        this.registerCommand(
          "/radarreset",
          function () {
            localStorage.removeItem("Hudloader_RadarType");
            eLUdD_O.dialog.data = {
              type: "\u041E\u0432\u0430\u043B\u044C\u043D\u044B\u0439",
              color: null,
              lastSave: null,
              useLocalStorage: false,
              _notifiedLocal: false,
            };
            eLUdD_O.notification.show("info", "RadarType", "reset_default-settings");
            if (typeof eLUdD_O.HudloaderRadar?.changeRadar === "function") {
              eLUdD_O.HudloaderRadar.changeRadar("\u041E\u0432\u0430\u043B\u044C\u043D\u044B\u0439", null);
            }
          }.bind(this)
        );
      }
    },
  },

  userBind: {
    isUserBound: function (hwid) {
      if (!NewHudAssets) {
        return false;
      }

      if (NewHudAssets.userBind && Array.isArray(NewHudAssets.userBind)) {
        return NewHudAssets.userBind.includes(hwid.toUpperCase());
      }

      if (Array.isArray(NewHudAssets.scripts)) {
        for (var i = 0; i < NewHudAssets.scripts.length; i++) {
          var script = NewHudAssets.scripts[i];
          if (typeof script === "string" && script.toLowerCase().startsWith("hwid:")) {
            var parts = script.split(":");
            if (parts.length > 1 && parts[1]) {
              var allowed = parts[1].split(",").map(function (v) {
                return v.trim().toUpperCase();
              });
              if (allowed.indexOf(hwid.toUpperCase()) !== -1) {
                return true;
              }
            }
          }
        }
      }
      return false;
    },

    saveToTxt: function (hwid) {
      eLUdD_O.socket.sendEvent("writeFile", {
        file: "hwid.txt",
        data: hwid,
      });
    },

    check: function (callback) {
      var self = this;
      var scripts =
        (typeof NewHudAssets !== "undefined" && NewHudAssets && Array.isArray(NewHudAssets.scripts))
          ? NewHudAssets.scripts
          : [];
      var hasHwid = scripts.some(function (s) {
        return typeof s === "string" && s.toLowerCase().startsWith("hwid");
      });

      if (!hasHwid) {
        if (typeof callback === "function") callback();
        return;
      }

      eLUdD_O.socket
        .sendEvent("getHwid", {})
        .callback(function (hwid) {
          if (
            hwid &&
            typeof hwid === "string" &&
            new RegExp("^[0-9A-F]{16}$", "i").test(hwid)
          ) {
            var upper = hwid.toUpperCase();
            if (!self.isUserBound(upper)) {
              self.saveToTxt(upper);
              eLUdD_O.socket.sendEvent("copyToClipboard", { text: upper });
              eLUdD_O.RadmirDialog.show({
                title: "Hudloader-Hwid",
                subtitle: "\u0422\u0432\u043E\u0439 HWID \u043D\u0435 \u0432 \u0441\u043F\u0438\u0441\u043A\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u0445",
                type: "text",
                content:
                  "\u0422\u0432\u043E\u0439 \u043A\u043B\u044E\u0447: <b>" +
                  upper +
                  "</b><br>\u041E\u043D \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D \u0432 \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u0432 hwid.txt<br>\u041E\u0442\u043F\u0440\u0430\u0432\u044C \u0435\u0433\u043E \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0443 \u0441\u0431\u043E\u0440\u043A\u0438.",
                btn1: "\u041F\u043E\u043D\u044F\u043B",
                btn2: "",
                onBtn1: function () {},
                onBtn2: function () {},
              });
            } else {
              if (typeof callback === "function") callback();
            }
          } else {
            eLUdD_O.notification.show("warning", "Hudloader", "Ошибка получения HWID");
          }
        });
    },
  },

  speedometer: {
    barsValues: {
      speed: { dashArray: 345, dashOffset: 345 },
      fuel: { dashArray: 171, dashOffset: 0 },
      wash: { dashArray: 103, dashOffset: 103 },
      damage: { dashArray: 103, dashOffset: 103 },
    },

    data: {
      speedometerE: null,
      speed: { valueEl: null, barEl: null },
      fuel: { valueEl: null, barEl: null, wrapperEl: null, textEl: null },
      wash: { valueEl: null, barEl: null, wrapperEl: null },
      damage: { valueEl: null, barEl: null },
      tachometer: { wrapper: null, rpmEl: null, gearEl: null },
      mileageEl: null,
      turnsEls: [],
      paramsEls: [],
    },

    onChangeInfo: function (key, value) {
      try {
        if (key === "damage") {
          if (isNaN(value * 100)) value = 0;
          this.setDamage(+value);
        }
        if (key === "wash") {
          if (isNaN(value * 100)) value = 0;
          this.setWash(+value);
        }
        if (key === "show" && +value == 1) this.show();
        if (key === "show" && +value == 0) this.hide();
        if (key === "speed") this.setSpeed(value);
        if (key === "mileage") this.setMileage(value);
        if (key === "fuel") this.setFuel(value);
        if (key == "left") {
          this.data.turnsEls[0].classList.toggle(
            "Hudloader-speedometer-turn--active",
            +value
          );
        }
        if (key == "right") {
          this.data.turnsEls[1].classList.toggle(
            "Hudloader-speedometer-turn--active",
            +value
          );
        }
        if (key == "rem") {
          this.data.paramsEls[2].classList.toggle(
            "Hudloader-speedometer-param--active",
            +value
          );
        }
        if (key == "doors") {
          this.data.paramsEls[3].classList.toggle(
            "Hudloader-speedometer-param--active",
            +value
          );
        }
        if (key == "temperature") {
          this.data.paramsEls[0].classList.toggle(
            "Hudloader-speedometer-param--active",
            +value
          );
        }
        if (key == "lights") {
          this.data.paramsEls[1].classList.toggle(
            "Hudloader-speedometer-param--active",
            +value
          );
        }
        if (key === "tachometer-show") {
          const display = +value >= 1 ? "" : "none";
          this.data.tachometer.wrapper.style.display = display;
        }
        if (key === "tachometer") {
          this.setGear(value.gear);
          this.setTachomete(value.rpm, value.maxRpm);
        }
      } catch (e) {
        console.error(e);
      }
    },

    show: function () {
      this.data.speedometerE.style.bottom = "3.7037vh";
    },

    hide: function () {
      this.data.speedometerE.style.bottom = "-70vh";
    },

    setGear: function (gear) {
      this.data.tachometer.gearEl.textContent = gear;
    },

    setTachomete: function (rpm, maxRpm) {
      window.interface("Hud").speedometer.tachometer.show
        ? this.data.tachometer.wrapper.classList.toggle(
            "Hudloader-tachometer-glow",
            rpm / maxRpm > 0.5
          )
        : this.data.tachometer.wrapper.classList.toggle(
            "Hudloader-tachometer-glow",
            false
          );
      if (rpm > maxRpm) rpm = maxRpm;
      this.data.tachometer.rpmEl.textContent = rpm;
    },

    setMileage: function (value) {
      this.data.mileageEl.textContent = value;
    },

    setSpeed: function (value) {
      this.data.speed.valueEl.textContent = value;
    },

    setDamage: function (value) {
      this.data.damage.valueEl.textContent = Math.floor(value * 100);
    },

    setWash: function (value) {
      this.data.wash.wrapperEl.classList.toggle(
        "Hudloader-speedometer-danger",
        value >= 0.75
      );
      this.data.wash.valueEl.textContent = Math.floor(value * 100);
    },

    setFuel: function (value) {
      this.data.fuel.wrapperEl.classList.toggle(
        "Hudloader-speedometer-danger",
        value <= 15
      );
      this.data.fuel.valueEl.textContent = value;
      window.interface("Hud").speedometer.isElectro
        ? (this.data.fuel.textEl.textContent = "%")
        : (this.data.fuel.textEl.textContent = "л");
    },

    create: function (root) {
      this.data.speedometerE = root;
      this.data.speed.valueEl = root.querySelector(".Hudloader-speedometer-speed__value");
      this.data.speed.barEl = root.querySelector(".Hudloader-speedometer-speed__bar");
      this.data.fuel.wrapperEl = root.querySelector(".Hudloader-speedometer__fuel");
      this.data.fuel.valueEl = root.querySelector(".Hudloader-speedometer-fuel__value");
      this.data.fuel.barEl = root.querySelector(".Hudloader-speedometer-fuel__bar");
      this.data.fuel.textEl = root.querySelector(".Hudloader-speedometer-fuel__text");
      this.data.wash.valueEl = root.querySelector(".Hudloader-speedometer-wash__value");
      this.data.wash.barEl = root.querySelector(".Hudloader-speedometer-wash__bar");
      this.data.wash.wrapperEl = root.querySelector(".Hudloader-speedometer__wash");
      this.data.damage.valueEl = root.querySelector(".Hudloader-speedometer-damage__value");
      this.data.damage.barEl = root.querySelector(".Hudloader-speedometer-damage__bar");
      this.data.mileageEl = root.querySelector(".Hudloader-speedometer-mileage__value");
      this.data.paramsEls = root.querySelector(".Hudloader-speedometer-params").children;
      this.data.turnsEls = root.querySelector(".Hudloader-speedometer__turns").children;
      this.data.tachometer.wrapper = root.querySelector(".Hudloader-speedometer__tachometer");
      this.data.tachometer.gearEl = this.data.tachometer.wrapper.querySelector("#Hudloader-tachometer-gea");
      this.data.tachometer.rpmEl = this.data.tachometer.wrapper.querySelector("#Hudloader-tachometer-rpm");
    },

    setStylesspedoometr: function () {
      eLUdD_O.createStyles(SPEEDOMETER_CSS, "hudloader-speedometer-css");
    },

    init: function () {
      if (NewHudAssets?.scripts?.includes("Speedometr")) {
        this.setStylesspedoometr();
        eLUdD_O.notification.show("info", "SpeedometrBlack", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");

        const root = eLUdD_O.addNewInterfaces.addNewSpeedometer(
          SPEEDOMETER_HTML,
          "Hudloader-speedometer",
          (key, value) => this.onChangeInfo(key, value)
        );

        this.create(root);
      }
    },
  },

  speedometerharnelo: {
    barsValues: {
      speed: { dashArray: 345, dashOffset: 345 },
      fuel: { dashArray: 171, dashOffset: 0 },
      wash: { dashArray: 103, dashOffset: 103 },
      damage: { dashArray: 103, dashOffset: 103 },
    },

    data: {
      speedometerE: null,
      speed: { valueEl: null, barEl: null },
      fuel: { valueEl: null, barEl: null, wrapperEl: null, textEl: null },
      wash: { valueEl: null, barEl: null, wrapperEl: null },
      damage: { valueEl: null, barEl: null },
      tachometer: { wrapper: null, rpmEl: null, gearEl: null },
      mileageEl: null,
      turnsEls: [],
      paramsEls: [],
    },

    onChangeInfo: function (key, value) {
      try {
        if (key === "damage") {
          if (isNaN(value * 100)) value = 0;
          this.setDamage(+value);
        }
        if (key === "wash") {
          if (isNaN(value * 100)) value = 0;
          this.setWash(+value);
        }
        if (key === "show" && +value == 1) this.show();
        if (key === "show" && +value == 0) this.hide();
        if (key === "speed") this.setSpeed(value);
        if (key === "mileage") this.setMileage(value);
        if (key === "fuel") this.setFuel(value);
        if (key == "left") {
          this.data.turnsEls[0].classList.toggle(
            "Hudloader-speedometer-turn--active",
            +value
          );
        }
        if (key == "right") {
          this.data.turnsEls[1].classList.toggle(
            "Hudloader-speedometer-turn--active",
            +value
          );
        }
        if (key == "rem") {
          this.data.paramsEls[2].classList.toggle(
            "Hudloader-speedometer-param--active",
            +value
          );
        }
        if (key == "doors") {
          this.data.paramsEls[3].classList.toggle(
            "Hudloader-speedometer-param--active",
            +value
          );
        }
        if (key == "temperature") {
          this.data.paramsEls[0].classList.toggle(
            "Hudloader-speedometer-param--active",
            +value
          );
        }
        if (key == "lights") {
          this.data.paramsEls[1].classList.toggle(
            "Hudloader-speedometer-param--active",
            +value
          );
        }
        if (key === "tachometer-show") {
          const display = +value >= 1 ? "" : "none";
          this.data.tachometer.wrapper.style.display = display;
        }
        if (key === "tachometer") {
          this.setGear(value.gear);
          this.setTachomete(value.rpm, value.maxRpm);
        }
      } catch (e) {
        console.error(e);
      }
    },

    show: function () {
      this.data.speedometerE.style.bottom = "3.7037vh";
    },

    hide: function () {
      this.data.speedometerE.style.bottom = "-70vh";
    },

    setGear: function (gear) {
      this.data.tachometer.gearEl.textContent = gear;
    },

    setTachomete: function (rpm, maxRpm) {
      window.interface("Hud").speedometer.tachometer.show
        ? this.data.tachometer.wrapper.classList.toggle(
            "Hudloader-tachometer-glow",
            rpm / maxRpm > 0.5
          )
        : this.data.tachometer.wrapper.classList.toggle(
            "Hudloader-tachometer-glow",
            false
          );
      if (rpm > maxRpm) rpm = maxRpm;
      this.data.tachometer.rpmEl.textContent = rpm;
    },

    setMileage: function (value) {
      this.data.mileageEl.textContent = value;
    },

    setSpeed: function (value) {
      this.data.speed.valueEl.textContent = value;
    },

    setDamage: function (value) {
      this.data.damage.valueEl.textContent = Math.floor(value * 100);
    },

    setWash: function (value) {
      this.data.wash.wrapperEl.classList.toggle(
        "Hudloader-speedometer-danger",
        value >= 0.75
      );
      this.data.wash.valueEl.textContent = Math.floor(value * 100);
    },

    setFuel: function (value) {
      this.data.fuel.wrapperEl.classList.toggle(
        "Hudloader-speedometer-danger",
        value <= 15
      );
      this.data.fuel.valueEl.textContent = value;
      window.interface("Hud").speedometer.isElectro
        ? (this.data.fuel.textEl.textContent = "%")
        : (this.data.fuel.textEl.textContent = "л");
    },

    create: function (root) {
      this.data.speedometerE = root;
      this.data.speed.valueEl = root.querySelector(".Hudloader-speedometer-speed__value");
      this.data.speed.barEl = root.querySelector(".Hudloader-speedometer-speed__bar");
      this.data.fuel.wrapperEl = root.querySelector(".Hudloader-speedometer__fuel");
      this.data.fuel.valueEl = root.querySelector(".Hudloader-speedometer-fuel__value");
      this.data.fuel.barEl = root.querySelector(".Hudloader-speedometer-fuel__bar");
      this.data.fuel.textEl = root.querySelector(".Hudloader-speedometer-fuel__text");
      this.data.wash.valueEl = root.querySelector(".Hudloader-speedometer-wash__value");
      this.data.wash.barEl = root.querySelector(".Hudloader-speedometer-wash__bar");
      this.data.wash.wrapperEl = root.querySelector(".Hudloader-speedometer__wash");
      this.data.damage.valueEl = root.querySelector(".Hudloader-speedometer-damage__value");
      this.data.damage.barEl = root.querySelector(".Hudloader-speedometer-damage__bar");
      this.data.mileageEl = root.querySelector(".Hudloader-speedometer-mileage__value");
      this.data.paramsEls = root.querySelector(".Hudloader-speedometer-params").children;
      this.data.turnsEls = root.querySelector(".Hudloader-speedometer__turns").children;
      this.data.tachometer.wrapper = root.querySelector(".Hudloader-speedometer__tachometer");
      this.data.tachometer.gearEl = this.data.tachometer.wrapper.querySelector("#Hudloader-tachometer-gea");
      this.data.tachometer.rpmEl = this.data.tachometer.wrapper.querySelector("#Hudloader-tachometer-rpm");
    },

    setStylesHarnelo: function () {
      eLUdD_O.createStyles(SPEEDOMETER_HARNELO_CSS, "hudloader-speedometer-harnelo-css");
    },

    init: function () {
      if (NewHudAssets?.scripts?.includes("Speedometr-harnelo")) {
        this.setStylesHarnelo();
        eLUdD_O.notification.show("info", "Speedometr", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");

        const root = eLUdD_O.addNewInterfaces.addNewSpeedometer(
          SPEEDOMETER_HTML,
          "Hudloader-speedometer",
          (key, value) => this.onChangeInfo(key, value)
        );

        this.create(root);
      }
    },
  },

  OLDspeedometer: {
    barsValues: {
      speed: { dashArray: 504, dashOffset: 504 },
      fuel: { dashArray: 171, dashOffset: 0 },
      wash: { dashArray: 172, dashOffset: 172 },
      damage: { dashArray: 172, dashOffset: 172 },
    },

    data: {
      speedometerE: null,
      speed: { valueEl: null, barEl: null },
      fuel: { progress: null, valueEl: null, barEl: null, wrapperEl: null, textEl: null },
      wash: { valueEl: null, barEl: null, wrapperEl: null },
      damage: { valueEl: null, barEl: null },
      tachometer: { wrapper: null, rpmEl: null, gearEl: null },
      mileageEl: null,
      turnsEls: [],
      paramsEls: [],
    },

    onChangeInfo: function (key, value) {
      try {
        if (key === "damage") {
          if (isNaN(value * 100)) value = 0;
          this.setDamage(+value);
        }
        if (key === "wash") {
          if (isNaN(value * 100)) value = 0;
          this.setWash(+value);
        }
        if (key === "show" && +value == 1) this.show();
        if (key === "show" && +value == 0) this.hide();
        if (key === "speed") this.setSpeed(value);
        if (key === "mileage") this.setMileage(value);
        if (key === "fuel") this.setFuel(value);
        if (key == "left") {
          this.data.turnsEls[0].classList.toggle(
            "OLDSPEHUDLOADER-speedometer-turn--active",
            +value
          );
        }
        if (key == "right") {
          this.data.turnsEls[1].classList.toggle(
            "OLDSPEHUDLOADER-speedometer-turn--active",
            +value
          );
        }
        if (key == "rem") {
          this.data.paramsEls[3].classList.toggle(
            "OLDSPEHUDLOADER-spedometer-param--active",
            +value
          );
        }
        if (key == "doors") {
          this.data.paramsEls[2].classList.toggle(
            "OLDSPEHUDLOADER-spedometer-param--active",
            +value
          );
        }
        if (key == "temperature") {
          this.data.paramsEls[0].classList.toggle(
            "OLDSPEHUDLOADER-spedometer-param--active",
            +value
          );
        }
        if (key == "lights") {
          this.data.paramsEls[1].classList.toggle(
            "OLDSPEHUDLOADER-spedometer-param--active",
            +value
          );
        }
        if (key === "tachometer-show") {
          const display = +value >= 1 ? "" : "none";
          this.data.tachometer.wrapper.style.display = display;
        }
        if (key === "tachometer") {
          this.setGear(value.gear);
          this.setTachomete(value.rpm, value.maxRpm);
        }
      } catch (e) {
        console.error(e);
      }
    },

    show: function () {
      this.data.speedometerE.style.display = "";
    },

    hide: function () {
      this.data.speedometerE.style.display = "none";
    },

    setGear: function (gear) {
      this.data.tachometer.gearEl.textContent = gear;
    },

    setTachomete: function (rpm, maxRpm) {
      window.interface("Hud").speedometer.tachometer.show
        ? this.data.tachometer.wrapper.classList.toggle(
            "OLDSPEHUDLOADER-tachometer-glow",
            rpm / maxRpm > 0.5
          )
        : this.data.tachometer.wrapper.classList.toggle(
            "OLDSPEHUDLOADER-tachometer-glow",
            false
          );
      if (rpm > maxRpm) rpm = maxRpm;
      this.data.tachometer.rpmEl.textContent = rpm;
    },

    setMileage: function (value) {
      this.data.mileageEl.textContent = value;
    },

    setSpeed: function (value) {
      const maxSpeed = window.interface("Hud").speedometer.maxSpeed;
      this.data.speed.valueEl.textContent = value;
      if (value > maxSpeed) value = maxSpeed;
      const offset =
        this.barsValues.speed.dashArray -
        (value / maxSpeed) * this.barsValues.speed.dashArray;
      this.data.speed.barEl.setAttribute("stroke-dashoffset", offset);
    },

    setDamage: function (value) {
      const offset =
        this.barsValues.damage.dashArray -
        value * this.barsValues.damage.dashArray;
      this.data.damage.barEl.setAttribute("stroke-dashoffset", offset);
    },

    setWash: function (value) {
      document
        .querySelector(".OLDSPEHUDLOADER-wash__ba")
        .classList.toggle("OLDSPEHUDLOADER-speedometer-danger", value >= 0.75);
      const offset =
        this.barsValues.wash.dashArray -
        value * this.barsValues.wash.dashArray;
      this.data.wash.barEl.setAttribute("stroke-dashoffset", offset);
    },

    setFuel: function (value) {
      this.data.fuel.wrapperEl.classList.toggle(
        "OLDSPEHUDLOADER-speedometer-danger",
        value <= 15
      );
      const maxFuel = window.interface("Hud").speedometer.maxFuel;
      this.data.fuel.valueEl.textContent = value;
      window.interface("Hud").speedometer.isElectro
        ? (this.data.fuel.textEl.textContent = "%")
        : (this.data.fuel.textEl.textContent = "л");
      if (value > maxFuel) value = maxFuel;
    },

    create: function (root) {
      this.data.speedometerE = root;
      this.data.speed.valueEl = root.querySelector(".OLDSPEHUDLOADER-speed__value");
      this.data.speed.barEl = root.querySelector(".OLDSPEHUDLOADER-speed__bar path");
      this.data.fuel.valueEl = root.querySelector(".OLDSPEHUDLOADER-fuel__value");
      this.data.fuel.textEl = root.querySelector(".OLDSPEHUDLOADER-fuel__text");
      this.data.fuel.wrapperEl = root.querySelector(".OLDSPEHUDLOADER-speedometer__fuel");
      this.data.wash.barEl = root.querySelector(".OLDSPEHUDLOADER-wash__bar path");
      this.data.wash.wrapperEl = root.querySelector(".OLDSPEHUDLOADER-speedometer__wash");
      this.data.damage.barEl = root.querySelector(".OLDSPEHUDLOADER-damage__bar path");
      this.data.mileageEl = root.querySelector(".OLDSPEHUDLOADER-speed__mileage");
      this.data.paramsEls = root.querySelector(".OLDSPEHUDLOADER-speedometer__params").children;
      this.data.turnsEls = root.querySelector(".OLDSPEHUDLOADER-speedometer__turns").children;
      this.data.tachometer.wrapper = root.querySelector(".OLDSPEHUDLOADER-speedometer__tachometer");
      this.data.tachometer.gearEl = this.data.tachometer.wrapper.querySelector("#OLDSPEHUDLOADER-tachometer-gear");
      this.data.tachometer.rpmEl = this.data.tachometer.wrapper.querySelector("#OLDSPEHUDLOADER-tachometer-rpm");
    },

    getoldspeedometrcss: function () {
      eLUdD_O.createStyles(OLDSPEEDOMETER_CSS, "hudloader-oldspeedometer-css");
    },

    init: function () {
      if (NewHudAssets?.scripts.includes("OLDSpeedomet")) {
        this.getoldspeedometrcss();
        eLUdD_O.notification.show("info", "OLDSpeedometr", "\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d");

        const root = eLUdD_O.speedometerAlt.createSpeedometer(
          OLDSPEEDOMETER_HTML,
          "OLDSPEHUDLOADER-speedometer",
          (key, value) => this.onChangeInfo(key, value)
        );

        this.create(root);
        window.interface("Hud").speedometer.show = 0;
      }
    },
  },

  InterfaceHoo: {
    isInitialize: false,
    customInterfaces: new Set(),
    customStates: {},
    originalOpenInterface: null,
    originalCloseInterface: null,
    originalGetInterfaceStatu: null,
    originalAddDialogInQueue: null,
    originalOpenPauseMenu: null,
    originalIsDialogOpened: null,
    originalSendKeyEvent: null,
    originalOnKeyDown: null,

    init: function () {
      if (this.isInitialize) return;
      this.originalOpenInterface = window.openInterface;
      this.originalCloseInterface = window.closeInterface;
      this.originalGetInterfaceStatu = window.getInterfaceStatus;
      this.originalAddDialogInQueue = window.addDialogInQueue;
      this.originalOpenPauseMenu = window.openPauseMen;
      this.originalIsDialogOpened = window.IsDialogOpened;
      this.originalSendKeyEvent = window.sendKeyEvent;
      this.originalOnKeyDown = window.onKeyDown;
      this.isInitialize = true;
    },

    register: function (name) {
      if (!this.isInitialize) this.init();
      this.customInterfaces.add(name);
      this.customStates[name] = { open: false, params: null };
    },

    openCustom: function (name, params) {
      if (!this.customInterfaces.has(name)) return;
      if (this.customStates[name].open) return;
      this.customStates[name].open = true;
      this.customStates[name].params = params || {};
      window.inputFocus = true;
      window.cursorStatus = true;
      document.body.style.cursor = "default";
      document.documentElement.style.cursor = "default";
      if (typeof window.setCursorStatus === "function") {
        window.setCursorStatus(name, true);
      }
    },

    closeCustom: function (name) {
      if (!this.customInterfaces.has(name)) return;
      this.customStates[name].open = false;
      this.customStates[name].params = null;
      const anyOpen = this.isAnyCustomInterfaceOpen();
      if (!anyOpen) {
        setTimeout(() => {
          if (!this.isAnyCustomInterfaceOpen()) {
            window.inputFocus = false;
            window.cursorStatus = false;
            document.body.style.cursor = "none";
            document.documentElement.style.cursor = "none";
          }
        }, 100);
      }
    },

    getStatus: function (name) {
      if (this.customInterfaces.has(name)) {
        return this.customStates[name]?.open ?? false;
      }
      return this.originalGetInterfaceStatu
        ? this.originalGetInterfaceStatu.call(window, name)
        : false;
    },

    isAnyCustomInterfaceOpen: function () {
      for (const name of this.customInterfaces) {
        if (this.customStates[name]?.open) return true;
      }
      return false;
    },

    applyGlobalHooks: function () {
      if (!this.isInitialize) this.init();
      const self = this;
      const ESC_KEY = 27;

      window.IsDialogOpened = function () {
        const customOpen = self.isAnyCustomInterfaceOpen();
        const originalOpen = self.originalIsDialogOpened
          ? self.originalIsDialogOpened.call(window)
          : false;
        return customOpen || originalOpen;
      };

      window.sendKeyEvent = function (key) {
        if (key === ESC_KEY && self.isAnyCustomInterfaceOpen()) return;
        if (self.originalSendKeyEvent) {
          return self.originalSendKeyEvent.call(window, key);
        }
      };

      if (typeof window.onKeyDown === "function") {
        window.onKeyDown = function (key) {
          if (key === ESC_KEY && self.isAnyCustomInterfaceOpen()) return;
          if (self.originalOnKeyDown) {
            return self.originalOnKeyDown.call(window, key);
          }
        };
      }

      if (typeof this.originalOpenInterface === "function") {
        window.openInterface = new Proxy(this.originalOpenInterface, {
          apply: function (target, thisArg, args) {
            const name = args[0];
            if (name === "PauseMenu") {
              if (self.isAnyCustomInterfaceOpen()) return;
              const isOpen = self.originalGetInterfaceStatu
                ? self.originalGetInterfaceStatu.call(window, "PauseMenu")
                : false;
              if (isOpen) return;
              return Reflect.apply(target, thisArg, args);
            }
            if (self.customInterfaces.has(name)) {
              self.openCustom(name, args[1]);
              return;
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }

      if (typeof this.originalCloseInterface === "function") {
        window.closeInterface = new Proxy(this.originalCloseInterface, {
          apply: function (target, thisArg, args) {
            const name = args[0];
            if (self.customInterfaces.has(name)) {
              self.closeCustom(name);
              return;
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }

      if (typeof this.originalGetInterfaceStatu === "function") {
        window.getInterfaceStatus = new Proxy(this.originalGetInterfaceStatu, {
          apply: function (target, thisArg, args) {
            const name = args[0];
            if (self.customInterfaces.has(name)) {
              return self.getStatus(name);
            }
            return Reflect.apply(target, thisArg, args);
          },
        });
      }

      if (typeof this.originalAddDialogInQueue === "function") {
        window.addDialogInQueue = new Proxy(this.originalAddDialogInQueue, {
          apply: function (target, thisArg, args) {
            if (window.isFakeDialog) return;
            return Reflect.apply(target, thisArg, args);
          },
        });
      }

      window.openPauseMen = function () {
        if (self.isAnyCustomInterfaceOpen()) return false;
        const isOpen = self.originalGetInterfaceStatu
          ? self.originalGetInterfaceStatu.call(window, "PauseMenu")
          : false;
        if (isOpen) return false;
        if (self.originalOpenPauseMenu) {
          return self.originalOpenPauseMenu.call(window);
        }
      };
    },
  },

  RadmirDialog: {
    currentDialo: null,
    keydownHandler: null,
    captureKeydownHandler: null,
    currentCallbacks: { onBtn1: null, onBtn2: null },
    _initialized: false,
    _isClosing: false,
    INTERFACE_NAME: "HudloaderDialog",

    init: function () {
      if (this._initialized) return;
      eLUdD_O.InterfaceHoo.init();
      eLUdD_O.InterfaceHoo.register(this.INTERFACE_NAME);
      eLUdD_O.InterfaceHoo.applyGlobalHooks();
      this._initialized = true;
    },

    show: function (options) {
      if (!this._initialized) this.init();

      this.currentCallbacks.onBtn1 = options.onBtn1 || function () {};
      this.currentCallbacks.onBtn2 = options.onBtn2 || function () {};

      const params = Object.assign({}, options);
      delete params.onBtn1;
      delete params.onBtn2;

      window.openInterface(this.INTERFACE_NAME, params);
      this._renderDialo(options);
    },

    close: function () {
      if (this._isClosing) return;
      this._isClosing = true;
      if (
        window.getInterfaceStatus &&
        window.getInterfaceStatus(this.INTERFACE_NAME)
      ) {
        if (typeof window.setCursorStatus === "function") {
          window.setCursorStatus(this.INTERFACE_NAME, false);
        }
        window.closeInterface(this.INTERFACE_NAME);
      }
      this._cleanupDom();
      this._isClosing = false;
    },

    injectStyles: function () {
      const css = `
        .radmir-dialog { position: fixed; overflow: visible !important; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999; display: flex; justify-content: center; align-items: center; background: transparent; pointer-events: none; z-index: 1; }
        .radmir-dialog .window { position: relative; overflow: hidden !important; padding: 2.96vh; height: auto !important; background: linear-gradient(136.3deg,rgba(244,241,225,.1) -.6%,rgba(244,241,225,0) 75.57%),linear-gradient(124.45deg,rgba(20,20,20,.7) 15.6%,rgba(20,20,20,.1) 143.46%); border: .09vh solid rgba(244,241,225,.2); pointer-events: auto; min-width: 40vh; max-width: 80vw; color: #f4f1e1; transform: scale(0.8); border-radius: 0.5vh; z-index: 1; }
        .radmir-dialog .window__head { border-bottom: .09vh solid rgba(244,241,225,.25); width: 100%; padding-bottom: 1.48vh; }
        .radmir-dialog .window__title { font-weight: 600; font-size: 2.22vh; line-height: 3.33vh; color: #f4f1e1 !important; overflow: hidden; }
        .radmir-dialog .window__subtitle { font-size: 1.52vh; line-height: 100%; font-weight: 600; color: #ffffff59 !important; margin-top: .65vh; overflow: hidden; }
        .radmir-dialog .window__content { margin-top: 2.96vh; height: auto; width: 100%; color: #f4f1e1 !important; }
        .radmir-dialog .window-list { height: auto; max-height: 35vh; overflow-y: auto; overflow-x: hidden; }
        .radmir-dialog .window-list__item { padding: 1.48vh; margin-top: .93vh; color: #f4f1e1 !important; border: .09vh solid rgba(244,241,225,.1); cursor: pointer; position: relative; transition: all .25s ease; }
        .radmir-dialog .window-list__item:first-child { margin: 0; }
        .radmir-dialog .window-list__item:hover { border-color: #f4f1e166; }
        .radmir-dialog .window-list__item.selected { background: #f4f1e1; color: #141414 !important; border: .09vh solid rgba(244,241,225,.4); }
        .radmir-dialog .window-list__item.selected .window-list__item--title { color: #141414 !important; }
        .radmir-dialog .window-list__item--title { font-weight: 600; font-size: 1.65vh; line-height: 100%; transition-duration: .25s; color: #f4f1e1 !important; }
        .radmir-dialog .window__buttons { margin-top: 2.96vh; display: flex; justify-content: center; gap: 1.55vh; }
        .radmir-dialog .window-button { padding: 0 3.93vh; height: 6.11vh; min-width: 15vh; color: #f4f1e1 !important; font-weight: 700; font-size: 1.48vh; line-height: 2.22vh; background: rgba(244,241,225,.1); cursor: pointer; display: flex; justify-content: center; align-items: center; text-transform: uppercase; transition: all .25s ease; border-radius: 0.3vh; }
        .radmir-dialog .window-button:first-child { background: #f4f1e1; color: #141414 !important; }
        .radmir-dialog .window.with-hover .window-button:hover { background: #f4f1e1; color: #141414 !important; }
        .radmir-dialog .window-input { height: 3.43vh; display: flex; justify-content: space-between; transition-duration: .25s; border-bottom: .09vh solid rgba(244,241,225,.4); position: relative; margin-top: 1.05vh; }
        .radmir-dialog .window-input input { background: transparent; border: 0; color: #f4f1e1 !important; width: 100%; position: absolute; top: 0; left: 0; z-index: 2; outline: none; font-weight: 600; font-size: 1.65vh; line-height: 2.78vh; font-family: 'Open Sans', sans-serif; }
        .radmir-dialog .window-input__placeholder { position: absolute; top: 50%; transform: translateY(-50%); color: #f4f1e199 !important; z-index: 1; pointer-events: none; font-weight: 600; font-size: 1.65vh; line-height: 2.78vh; font-family: 'Open Sans', sans-serif; }
        .radmir-dialog .window-input__text { margin-bottom: 1.05vh; font-weight: 600; font-size: 1.65vh; line-height: 2.78vh; color: #f4f1e1cc !important; }
        .radmir-dialog .window-list::-webkit-scrollbar { width: 0.5vh; }
        .radmir-dialog .window-list::-webkit-scrollbar-track { background: rgba(244,241,225,0.1); border-radius: 1vh; }
        .radmir-dialog .window-list::-webkit-scrollbar-thumb { background: rgba(244,241,225,0.4); border-radius: 1vh; }
        .radmir-dialog .window-list::-webkit-scrollbar-thumb:hover { background: rgba(244,241,225,0.7); }
        .radmir-dialog .window-bg { position: absolute; pointer-events: none; width: 100vw; height: 100vh; background-image: url("data:image/png;base64,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"); opacity: 0.75; background-position: center; background-repeat: no-repeat; top: 0; left: 0; z-index: -1; }
        .radmir-dialog .window::before {content: '';position: absolute;width: 101.67vh;height: 101.67vh;right: -8.17vh;top: 50%;transform: translateY(-50%);pointer-events: none;z-index: -1;background-size: contain;background-position: center;background-repeat: no-repeat; background-image: url("data:image/png;base64,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");}
      `;
      eLUdD_O.createStyles(css, "radmir-dialog-styles");
    },

    _renderDialo: function (options) {
      this.injectStyles();
      if (this.currentDialo) {
        this.currentDialo.remove();
        this.currentDialo = null;
      }

      const {
        title = "Заголовок",
        subtitle = "",
        type = "text",
        content = "",
        btn1 = "OK",
        btn2 = "Закрыть",
      } = options;

      let bodyHtml = "";

      if (type === "text") {
        bodyHtml = '<div class="window__content">' + content + "</div>";
      } else if (type === "input") {
        bodyHtml =
          '<div class="window__content">' +
          (content
            ? '<div class="window-input__text">' + content + "</div>"
            : "") +
          '\n                <div class="window-input" id="radmir-input-wrapper">\n                    <input type="text" id="radmir-input-field" autocomplete="off">\n                    <div class="window-input__placeholder" id="radmir-placeholder">\u0412\u0432\u0435\u0434\u0438\u0442\u0435\u0020\u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435</div>\n                </div></div>';
      } else if (type === "list") {
        const items = content.split("<n>").filter((i) => i.trim());
        let listHtml = '<div class="window-list" id="radmir-list-container">';
        items.forEach((item, index) => {
          listHtml +=
            '<div class="window-list__item" data-index="' +
            index +
            '" data-value="' +
            item.trim() +
            '">\n                    <div class="window-list__item--title">' +
            item.trim() +
            "</div>\n                </div>";
        });
        listHtml += "</div>";
        bodyHtml = '<div class="window__content">' + listHtml + "</div>";
      }

      const html =
        '\n    <div class="window-bg"></div>\n    <div class="window with-hover">\n        <div class="window__head">\n            <div class="window__title">' +
        title +
        "</div>\n            " +
        (subtitle
          ? '<div class="window__subtitle">' + subtitle + "</div>"
          : "") +
        "\n        </div>\n        " +
        bodyHtml +
        '\n        <div class="window__buttons">\n           ' +
        (btn1 ? '<div class="window-button" id="radmir-btn-1">' + btn1 + "</div>" : "") +
        "\n            " +
        (btn2 ? '<div class="window-button" id="radmir-btn-2">' + btn2 + "</div>" : "") +
        "\n        </div>\n    </div>\n";

      this.currentDialo = document.createElement("div");
      this.currentDialo.className = "radmir-dialog";
      this.currentDialo.innerHTML = html;
      document.body.appendChild(this.currentDialo);
      this._setupInteractions(options);
    },

    _setupInteractions: function (options) {
      const self = this;
      const type = options.type;
      let selectedIndex = -1;

      const trigger = (which, value) => {
        if (which === 1 && this.currentCallbacks.onBtn1) {
          this.currentCallbacks.onBtn1(value);
        } else if (which === 0 && this.currentCallbacks.onBtn2) {
          this.currentCallbacks.onBtn2(value);
        }
        this.close();
      };

      const selectItem = (index) => {
        const container = self.currentDialo.querySelector("#radmir-list-container");
        if (!container) return;
        const items = container.querySelectorAll(".window-list__item");
        items.forEach((it) => it.classList.remove("selected"));
        if (items[index]) {
          items[index].classList.add("selected");
          const top = items[index].offsetTop;
          const height = items[index].offsetHeight;
          const viewHeight = container.clientHeight;
          const scrollTop = container.scrollTop;
          if (index === 0) {
            container.scrollTop = 0;
          } else if (index === items.length - 1) {
            container.scrollTop = container.scrollHeight;
          } else if (top < scrollTop) {
            container.scrollTop = top;
          } else if (top + height > scrollTop + viewHeight) {
            container.scrollTop = top + height - viewHeight;
          }
        }
      };

      if (type === "input") {
        const input = this.currentDialo.querySelector("#radmir-input-field");
        const placeholder = this.currentDialo.querySelector("#radmir-placeholder");
        if (input && placeholder) {
          input.addEventListener("focus", () => (placeholder.style.display = "none"));
          input.addEventListener("blur", () => {
            if (!input.value) placeholder.style.display = "block";
          });
        }
      }

      if (type === "list") {
        const items = this.currentDialo.querySelectorAll(".window-list__item");
        items.forEach((item, index) => {
          item.addEventListener("click", () => {
            selectedIndex = index;
            selectItem(selectedIndex);
          });
        });
        if (items.length > 0) {
          selectedIndex = 0;
          selectItem(selectedIndex);
        }
      }

      const btn1El = this.currentDialo.querySelector("#radmir-btn-1");
      const btn2El = this.currentDialo.querySelector("#radmir-btn-2");

      if (btn1El) {
        btn1El.addEventListener("click", () => {
          if (type === "list" && selectedIndex >= 0) {
            trigger(1, this.currentDialo.querySelectorAll(".window-list__item")[selectedIndex].dataset.value);
          } else if (type === "input") {
            trigger(1, this.currentDialo.querySelector("#radmir-input-field").value);
          } else {
            trigger(1, "");
          }
        });
      }
      if (btn2El) {
        btn2El.addEventListener("click", () => {
          if (type === "input") {
            trigger(0, this.currentDialo.querySelector("#radmir-input-field").value);
          } else {
            trigger(0, "");
          }
        });
      }

      this.captureKeydownHandler = (e) => {
        const ESC = 27, ENTER = 13, UP = 38, DOWN = 40;
        if (e.keyCode === ESC) {
          e.preventDefault();
          e.stopImmediatePropagation();
          trigger(0, type === "input" ? this.currentDialo.querySelector("#radmir-input-field")?.value || "" : "");
          return;
        }
        if (e.keyCode === ENTER) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (type === "list" && selectedIndex >= 0) {
            trigger(1, this.currentDialo.querySelectorAll(".window-list__item")[selectedIndex].dataset.value);
          } else if (type === "input") {
            trigger(1, this.currentDialo.querySelector("#radmir-input-field").value);
          } else {
            trigger(1, "");
          }
          return;
        }
        if (type === "list" && (e.keyCode === UP || e.keyCode === DOWN)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const items = this.currentDialo.querySelectorAll(".window-list__item");
          if (items.length === 0) return;
          if (e.keyCode === UP) {
            selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
          } else {
            selectedIndex = selectedIndex >= items.length - 1 ? 0 : selectedIndex + 1;
          }
          selectItem(selectedIndex);
          return;
        }
      };
      document.addEventListener("keydown", this.captureKeydownHandler, true);

      this.keydownHandler = (e) => {
        const ESC = 27, ENTER = 13, UP = 38, DOWN = 40;
        if (e.keyCode === ESC) {
          e.preventDefault();
          trigger(0, type === "input" ? this.currentDialo.querySelector("#radmir-input-field")?.value || "" : "");
        } else if (e.keyCode === ENTER) {
          e.preventDefault();
          if (type === "list" && selectedIndex >= 0) {
            trigger(1, this.currentDialo.querySelectorAll(".window-list__item")[selectedIndex].dataset.value);
          } else if (type === "input") {
            trigger(1, this.currentDialo.querySelector("#radmir-input-field").value);
          } else {
            trigger(1, "");
          }
        } else if (type === "list" && (e.keyCode === UP || e.keyCode === DOWN)) {
          e.preventDefault();
          const items = this.currentDialo.querySelectorAll(".window-list__item");
          if (items.length === 0) return;
          if (e.keyCode === UP) {
            selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
          } else {
            selectedIndex = selectedIndex >= items.length - 1 ? 0 : selectedIndex + 1;
          }
          selectItem(selectedIndex);
        }
      };
      document.addEventListener("keydown", this.keydownHandler, false);
    },

    _cleanupDom: function () {
      if (this.currentDialo) {
        this.currentDialo.remove();
        this.currentDialo = null;
      }
      if (this.captureKeydownHandler) {
        document.removeEventListener("keydown", this.captureKeydownHandler, true);
        this.captureKeydownHandler = null;
      }
      if (this.keydownHandler) {
        document.removeEventListener("keydown", this.keydownHandler, false);
        this.keydownHandler = null;
      }
      if (typeof window.setInputFocu === "function") {
        window.setInputFocu(true);
      }
    },
  },

  MenuLogo: {
    data: {
      width: 20,
      height: 6.05,
      lastSave: null,
      useLocalStorage: false,
      _notifiedLocal: false,
    },

    _getLogo: function () {
      return document.querySelector(".OLD-RADMIR-logo__image");
    },

    applySize: function (width, height) {
      const logo = this._getLogo();
      if (!logo) return false;
      logo.style.width = width + "vh";
      logo.style.height = height + "vh";
      this.data.width = width;
      this.data.height = height;
      return true;
    },

    saveConfig: function (callback) {
      if (!callback) callback = function () {};
      var self = this;

      var done = function (ok) {
        self.data.lastSave = Date.now();
        callback(ok);
      };

      try {
        if (NewHudAssets) {
          if (!NewHudAssets.logoSize) NewHudAssets.logoSize = {};
          NewHudAssets.logoSize.width = self.data.width;
          NewHudAssets.logoSize.height = self.data.height;
        }

        var json = JSON.stringify({
          width: self.data.width,
          height: self.data.height,
        });

        eLUdD_O.socket
          .sendEvent("writeFile", { file: "LogoSize.jso", data: json })
          .callback(function (res) {
            if (res instanceof Error || !res || res === "Error") {
              self._saveToLocalStorage(callback);
            } else {
              self.data.useLocalStorage = false;
              self.data._notifiedLocal = false;
              done(true);
            }
          });
      } catch (e) {
        self._saveToLocalStorage(callback);
      }
    },

    _saveToLocalStorage: function (callback) {
      try {
        localStorage.setItem(
          "Hudloader_LogoSize",
          JSON.stringify({ width: this.data.width, height: this.data.height })
        );
        this.data.useLocalStorage = true;
        if (!this.data._notifiedLocal) this.data._notifiedLocal = true;
      } catch (e) {}
      callback(true);
    },

    loadConfig: function (callback) {
      if (!callback) callback = function () {};
      var self = this;

      var fallback = function () {
        try {
          if (typeof localStorage !== "undefined") {
            var raw = localStorage.getItem("Hudloader_LogoSize");
            if (raw) {
              var parsed = JSON.parse(raw);
              if (parsed && !isNaN(parsed.width) && !isNaN(parsed.height)) {
                self.data.width = parsed.width;
                self.data.height = parsed.height;
              }
              self.data.useLocalStorage = true;
              callback(self.data);
              return;
            }
          }
        } catch (e) {}
        callback(self.data);
      };

      eLUdD_O.socket
        .sendEvent("readFile", { file: "LogoSize.jso" })
        .callback(function (res) {
          try {
            if (res instanceof Error || !res || res.trim() === "") {
              fallback();
            } else {
              var parsed = JSON.parse(res);
              if (parsed && !isNaN(parsed.width) && !isNaN(parsed.height)) {
                self.data.width = parsed.width;
                self.data.height = parsed.height;
              }
              self.data.useLocalStorage = false;
              self.data._notifiedLocal = false;
              callback(self.data);
            }
          } catch (e) {
            fallback();
          }
        });
    },

showSizeDialog: function () {
  var self = this;
  eLUdD_O.RadmirDialog.show({
    title: "\u0420\u0430\u0437\u043c\u0435\u0440 \u043b\u043e\u0433\u043e\u0442\u0438\u043f\u0430",
    subtitle: "\u0422\u0435\u043a\u0443\u0449\u0438\u0439: " + this.data.width + "vh \u00d7 " + this.data.height + "vh",
    type: "input",
    content: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0448\u0438\u0440\u0438\u043d\u0443 \u0438 \u0432\u044b\u0441\u043e\u0442\u0443 \u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u043f\u044f\u0442\u0443\u044e.<br>\u0424\u043e\u0440\u043c\u0430\u0442: <b>\u0448\u0438\u0440\u0438\u043d\u0430,\u0432\u044b\u0441\u043e\u0442\u0430</b><br>\u041f\u0440\u0438\u043c\u0435\u0440: <b>20,7</b>",
    btn1: "\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c",
    btn2: "\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c",
    onBtn1: function (value) {
      try {
        var input = (value || "").trim();
        if (!input) return;
        var parts = input.split(",").map(function (v) {
          return parseFloat(v.trim().replace(",", "."));
        });
        if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return;
        var w = parts[0], h = parts[1];
        if (w < 1 || w > 100 || h < 1 || h > 100) return;
        self.applySize(w, h) ? self.saveConfig() : 0;
      } catch (e) {}
    },
    onBtn2: function () {
      self.applySize(20, 6.05);
      localStorage.removeItem("Hudloader_LogoSize");
      self.saveConfig();
    }
  });
},

    init: function () {
      var self = this;
      try {
        var apply = function () {
          self.applySize(self.data.width, self.data.height)
            ? 0
            : setTimeout(apply, 250);
        };
        this.loadConfig(function () {
          apply();
        });
        eLUdD_O.chat.registerCommand("/logosize", function () {
          self.showSizeDialog();
          return 0;
        });
      } catch (error) {}
    },
  },

  init() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      this.userBind.check(
        function () {
          try { eLUdD_O.addNewInterfaces.init(); } catch (e) { console.error("addNewInterfaces.init", e); }
          try { eLUdD_O.hud.init(); } catch (e) { console.error("hud.init", e); }
          try { eLUdD_O.OLDspeedometer.init(); } catch (e) { console.error("OLDspeedometer.init", e); }
          try { eLUdD_O.speedometer.init(); } catch (e) { console.error("speedometer.init", e); }
          try { eLUdD_O.CustomTablo.init(); } catch (e) { console.error("CustomTablo.init", e); }
          try { eLUdD_O.Oldzz.init(); } catch (e) { console.error("Oldzz.init", e); }
          try { eLUdD_O.SampOldTablo.init(); } catch (e) { console.error("SampOldTablo.init", e); }
          try { eLUdD_O.speedometerharnelo.init(); } catch (e) { console.error("speedometerharnelo.init", e); }
          try { eLUdD_O.HudloaderRadar.init(); } catch (e) { console.error("HudloaderRadar.init", e); }
          try { eLUdD_O.oldInfoCard.init(); } catch (e) { console.error("oldInfoCard.init", e); }
          try { eLUdD_O.oldTablo.init(); } catch (e) { console.error("oldTablo.init", e); }
          try { eLUdD_O.voice.init(); } catch (e) { console.error("voice.init", e); }
          try { eLUdD_O.chat.init(); } catch (e) { console.error("chat.init", e); }
          try { eLUdD_O.OLDCapturetables.init(); } catch (e) { console.error("OLDCapturetables.init", e); }
          try { eLUdD_O.hudToggle.init(); } catch (e) { console.error("hudToggle.init", e); }
          try { eLUdD_O.MenuLogo.init(); } catch (e) { console.error("MenuLogo.init", e); }
        },
        function (FDMQT5) {}
      );
    } catch (e) {
      console.error("eLUdD_O.init error:", e);
    }
  },
};

let RsjJIos = setInterval(() => {
  if (typeof window?.interface === "function" && window?.interface?.("Hud")?.info) {
    clearInterval(RsjJIos);
    eLUdD_O.init();
  }
}, 1750);

(function () {
  var lastType = "\u041e\u0432\u0430\u043b\u044c\u043d\u044b\u0439";
  var lastColor = null;

  if (typeof eLUdD_O !== "undefined" && eLUdD_O.HudloaderRadar) {
    var origChange = eLUdD_O.HudloaderRadar.changeRadar;
    eLUdD_O.HudloaderRadar.changeRadar = function (type, color) {
      if (type) lastType = type;
      if (color !== undefined) lastColor = color;
      return origChange.call(this, type, color);
    };
  }

  var observer = new MutationObserver(function () {
    var el = document.querySelector(".hud-radmir-radar");
    if (!el) return;

    var expectedClass = eLUdD_O.HudloaderRadar.data.radarClasses[lastType] || "radar-oval";
    if (!el.classList.contains(expectedClass)) {
      if (typeof eLUdD_O.HudloaderRadar.changeRadar === "function") {
        eLUdD_O.HudloaderRadar.changeRadar(lastType, lastColor);
      }
    }
  });

  var app = document.getElementById("app") || document.body;
  observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
})();
