"use strict";

/*
  CHT 360°‰. — samostatná vrstva vzhledů koulí.
  Tento soubor nevlastní Paměť, sloty, dotyk ani oběh. Pouze kreslí
  Země a Jazyk do canvasu, který mu bezpečně předá aplikace.js.
*/
(() => {
  const EARTH_ORBIT_GLYPHS = Object.freeze([
    "7i_",
    "९נֶ",
    "¡´",
    "ii´",
    "j´",
    "°&"
  ]);

  const LANGUAGE_TOKENS = Object.freeze([
    ..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "ア", "°", "‰", "•", "_", "-", "/", "ˇ", "ī", "ı", "ï", "ø", "Ō"
  ]);

  const LANGUAGE_LATITUDES = 9;
  const LANGUAGE_LONGITUDES = 14;
  const LANGUAGE_NODES = Object.freeze(createLanguageNodes());

  function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function createLanguageNodes() {
    const nodes = [];

    for (let row = 0; row < LANGUAGE_LATITUDES; row += 1) {
      const latitude =
        ((row / (LANGUAGE_LATITUDES - 1)) - .5) * Math.PI * .88;

      for (let column = 0; column < LANGUAGE_LONGITUDES; column += 1) {
        nodes.push(Object.freeze({
          row,
          column,
          latitude,
          longitude: column / LANGUAGE_LONGITUDES * Math.PI * 2,
          glyph: LANGUAGE_TOKENS[
            modulo(row * 11 + column * 7, LANGUAGE_TOKENS.length)
          ]
        }));
      }
    }

    return nodes;
  }

  function drawCzechRepublic(context, position, radius, scene, spin) {
    context.save();
    context.translate(
      position.x + Math.sin(spin) * radius * .055,
      position.y
    );
    context.rotate(Math.sin(scene.pitch) * .08);

    const land = context.createLinearGradient(
      -radius * .72,
      -radius * .42,
      radius * .72,
      radius * .48
    );
    land.addColorStop(0, "rgba(255,247,201,.98)");
    land.addColorStop(.34, "rgba(255,202,88,.96)");
    land.addColorStop(.72, "rgba(193,103,26,.92)");
    land.addColorStop(1, "rgba(104,47,12,.90)");
    context.fillStyle = land;
    context.shadowColor = "rgba(255,179,55,.82)";
    context.shadowBlur = radius * .12;

    /* Stylizovaná silueta České republiky. */
    context.beginPath();
    context.moveTo(-radius * .78, -radius * .04);
    context.lineTo(-radius * .68, -radius * .28);
    context.lineTo(-radius * .49, -radius * .38);
    context.lineTo(-radius * .30, -radius * .30);
    context.lineTo(-radius * .16, -radius * .40);
    context.lineTo(radius * .01, -radius * .32);
    context.lineTo(radius * .17, -radius * .42);
    context.lineTo(radius * .36, -radius * .29);
    context.lineTo(radius * .58, -radius * .31);
    context.lineTo(radius * .76, -radius * .12);
    context.lineTo(radius * .70, radius * .08);
    context.lineTo(radius * .54, radius * .17);
    context.lineTo(radius * .42, radius * .32);
    context.lineTo(radius * .21, radius * .27);
    context.lineTo(radius * .06, radius * .41);
    context.lineTo(-radius * .11, radius * .30);
    context.lineTo(-radius * .29, radius * .34);
    context.lineTo(-radius * .46, radius * .20);
    context.lineTo(-radius * .66, radius * .18);
    context.lineTo(-radius * .81, radius * .05);
    context.closePath();
    context.fill();

    [
      [-.40, -.04],
      [.03, -.10],
      [.42, .04]
    ].forEach(([x, y]) => {
      context.beginPath();
      context.arc(
        x * radius,
        y * radius,
        Math.max(1.05, radius * .035),
        0,
        Math.PI * 2
      );
      context.fillStyle = "rgba(255,250,222,.92)";
      context.fill();
    });

    context.restore();
  }

  function drawEarthGlyphs(api) {
    const {
      context,
      position,
      radius,
      scene,
      time
    } = api;
    const orbitRadius = radius * 1.43;
    const nodeRadius = Math.max(7, radius * .17);
    const turn = time * .00018 + scene.yaw * .22;

    EARTH_ORBIT_GLYPHS.forEach((glyph, index) => {
      const angle = turn + index / EARTH_ORBIT_GLYPHS.length * Math.PI * 2;
      const x = position.x + Math.cos(angle) * orbitRadius;
      const y = position.y + Math.sin(angle) * orbitRadius * .74;

      context.save();
      context.globalAlpha = .72;
      context.strokeStyle = "rgba(255,203,100,.34)";
      context.lineWidth = .7;
      context.beginPath();
      context.moveTo(position.x, position.y);
      context.lineTo(x, y);
      context.stroke();

      const glow = context.createRadialGradient(
        x,
        y,
        1,
        x,
        y,
        nodeRadius * 1.8
      );
      glow.addColorStop(0, "rgba(255,239,188,.95)");
      glow.addColorStop(.18, "rgba(214,126,31,.88)");
      glow.addColorStop(.48, "rgba(44,27,12,.98)");
      glow.addColorStop(1, "rgba(255,171,43,0)");

      context.globalAlpha = 1;
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, nodeRadius * 1.8, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "rgba(12,9,6,.96)";
      context.strokeStyle = "rgba(255,221,151,.86)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(x, y, nodeRadius, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = "#ffe8b2";
      context.font =
        "800 " +
        Math.max(6, Math.round(nodeRadius * .72)) +
        "px system-ui";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(glyph, x, y + .3);
      context.restore();
    });
  }

  function drawEarthStyle(api) {
    const {
      core,
      time,
      context,
      position,
      radius,
      active,
      scene,
      getCoreStats
    } = api;
    const spin = time * .00016 + scene.yaw + scene.roll * .22;

    context.save();
    context.globalAlpha = .64 + position.depth * .34;

    const halo = context.createRadialGradient(
      position.x,
      position.y,
      radius * .16,
      position.x,
      position.y,
      radius * 1.72
    );
    halo.addColorStop(0, "rgba(255,235,170,.34)");
    halo.addColorStop(
      .44,
      active ? "rgba(255,167,43,.38)" : "rgba(255,167,43,.22)"
    );
    halo.addColorStop(1, "rgba(255,155,35,0)");
    context.fillStyle = halo;
    context.beginPath();
    context.arc(position.x, position.y, radius * 1.72, 0, Math.PI * 2);
    context.fill();

    for (let ring = 0; ring < 3; ring += 1) {
      context.beginPath();
      context.ellipse(
        position.x,
        position.y + radius * 1.08,
        radius * (1.02 + ring * .18),
        radius * (.15 + ring * .025),
        0,
        0,
        Math.PI * 2
      );
      context.strokeStyle =
        "rgba(255,190,68," + (.35 - ring * .09) + ")";
      context.lineWidth = ring === 0 ? 1.2 : .7;
      context.stroke();
    }

    context.save();
    context.beginPath();
    context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    context.clip();

    const globe = context.createRadialGradient(
      position.x - radius * .28,
      position.y - radius * .32,
      radius * .05,
      position.x,
      position.y,
      radius * 1.08
    );
    globe.addColorStop(0, "#ffd978");
    globe.addColorStop(.18, "#a95b19");
    globe.addColorStop(.52, "#32180a");
    globe.addColorStop(.82, "#130b06");
    globe.addColorStop(1, "#050403");
    context.fillStyle = globe;
    context.fillRect(
      position.x - radius,
      position.y - radius,
      radius * 2,
      radius * 2
    );

    context.strokeStyle = "rgba(255,207,113,.20)";
    context.lineWidth = .65;
    for (let latitude = -3; latitude <= 3; latitude += 1) {
      const ratio = latitude / 4;
      const y = position.y + ratio * radius;
      const rx = Math.sqrt(Math.max(0, 1 - ratio * ratio)) * radius;
      context.beginPath();
      context.ellipse(
        position.x,
        y,
        rx,
        Math.max(2, rx * .12),
        0,
        0,
        Math.PI * 2
      );
      context.stroke();
    }

    for (let longitude = 0; longitude < 7; longitude += 1) {
      const phase = longitude / 7 * Math.PI + spin;
      const rx = Math.max(radius * .07, Math.abs(Math.cos(phase)) * radius);
      context.beginPath();
      context.ellipse(position.x, position.y, rx, radius, 0, 0, Math.PI * 2);
      context.strokeStyle = "rgba(255,218,139,.17)";
      context.stroke();
    }

    drawCzechRepublic(context, position, radius, scene, spin);
    context.restore();

    context.shadowColor = active
      ? "rgba(255,211,116,.95)"
      : "rgba(255,165,45,.82)";
    context.shadowBlur = active ? radius * .34 : radius * .22;
    context.strokeStyle = active
      ? "rgba(255,238,184,.96)"
      : "rgba(255,187,69,.88)";
    context.lineWidth = active ? 2.2 : 1.5;
    context.beginPath();
    context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    context.stroke();
    context.shadowBlur = 0;

    context.strokeStyle = "rgba(255,211,119,.30)";
    context.lineWidth = .8;
    context.beginPath();
    context.ellipse(
      position.x,
      position.y,
      radius * 1.20,
      radius * .29,
      -.18,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.beginPath();
    context.ellipse(
      position.x,
      position.y,
      radius * 1.28,
      radius * .34,
      .26,
      0,
      Math.PI * 2
    );
    context.stroke();

    const stats = getCoreStats(core.id);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(255,244,211,.94)";
    context.font =
      "900 " + Math.max(7, Math.round(radius * .16)) + "px system-ui";
    context.fillText("ZEMĚ", position.x, position.y + radius * .47);
    context.fillStyle = "rgba(255,226,168,.76)";
    context.font =
      "700 " + Math.max(6, Math.round(radius * .12)) + "px system-ui";
    context.fillText(stats.used + "/70", position.x, position.y + radius * .67);

    if (active) {
      drawEarthGlyphs(api);
    }

    context.restore();
    return { position, drawRadius: radius };
  }

  function projectLanguageNode(node, spin, tilt) {
    const longitude = node.longitude + spin;
    const latitudeRadius = Math.cos(node.latitude);
    const x = latitudeRadius * Math.cos(longitude);
    const y = Math.sin(node.latitude);
    const z = latitudeRadius * Math.sin(longitude);
    const tiltCos = Math.cos(tilt);
    const tiltSin = Math.sin(tilt);

    return {
      x,
      y: y * tiltCos - z * tiltSin,
      z: y * tiltSin + z * tiltCos
    };
  }

  function drawLanguageStyle(api) {
    const {
      core,
      time,
      context,
      position,
      scale,
      radius,
      active,
      scene,
      getCoreStats,
      drawCipherCoreTitle
    } = api;
    const surfaceSpin =
      scene.yaw * .84 +
      scene.roll * .28 +
      time * .000085;
    const surfaceTilt =
      scene.pitch * .48 +
      Math.sin(time * .00031) * .075;
    const nodes = LANGUAGE_NODES.map(node => {
      const projected = projectLanguageNode(node, surfaceSpin, surfaceTilt);
      const perspective = .78 + (projected.z + 1) * .14;

      return {
        ...node,
        x: projected.x * radius * perspective,
        y: projected.y * radius * perspective,
        z: projected.z,
        perspective
      };
    });

    const nodeAt = (row, column) => {
      const safeColumn = modulo(column, LANGUAGE_LONGITUDES);
      return nodes[row * LANGUAGE_LONGITUDES + safeColumn];
    };

    context.save();
    context.globalAlpha = .58 + position.depth * .36;
    context.beginPath();
    context.ellipse(
      position.x,
      position.y + radius * 1.09,
      radius * 1.12,
      radius * .23,
      0,
      0,
      Math.PI * 2
    );
    context.fillStyle = "rgba(0,0,0,.48)";
    context.fill();

    const halo = context.createRadialGradient(
      position.x,
      position.y,
      radius * .15,
      position.x,
      position.y,
      radius * 1.76
    );
    halo.addColorStop(
      0,
      active ? "rgba(255,238,192,.92)" : "rgba(255,207,112,.48)"
    );
    halo.addColorStop(.34, "rgba(247,167,60,.25)");
    halo.addColorStop(.72, "rgba(126,192,210,.09)");
    halo.addColorStop(1, "rgba(255,174,72,0)");
    context.fillStyle = halo;
    context.beginPath();
    context.arc(position.x, position.y, radius * 1.76, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.translate(position.x, position.y);
    context.rotate(surfaceTilt * .22);
    context.lineWidth = active ? 1.35 : .88;
    context.strokeStyle =
      "rgba(255,212,132," + (active ? ".74" : ".42") + ")";
    context.beginPath();
    context.ellipse(0, 0, radius * 1.29, radius * .53, 0, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([2.5, 4]);
    context.strokeStyle =
      "rgba(124,194,211," + (active ? ".64" : ".34") + ")";
    context.beginPath();
    context.ellipse(0, 0, radius * 1.12, radius * .79, -.37, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);

    const ringCode = "010110010111001001101011";
    context.fillStyle = "rgba(255,220,150,.76)";
    context.font =
      "700 " +
      Math.max(5, Math.round(radius * .105)) +
      "px ui-monospace, SFMono-Regular, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";

    for (let index = 0; index < ringCode.length; index += 1) {
      const angle =
        index / ringCode.length * Math.PI * 2 -
        surfaceSpin * .56;
      const x = Math.cos(angle) * radius * 1.3;
      const y = Math.sin(angle) * radius * .54;

      context.globalAlpha = .22 + (Math.sin(angle) + 1) * .22;
      context.fillText(ringCode[index], x, y);
    }
    context.restore();

    context.save();
    context.translate(position.x, position.y);
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.clip();

    const surface = context.createRadialGradient(
      -radius * .34,
      -radius * .40,
      radius * .06,
      0,
      0,
      radius * 1.12
    );
    surface.addColorStop(0, "rgba(255,226,165,.30)");
    surface.addColorStop(.32, "rgba(72,53,31,.94)");
    surface.addColorStop(.72, "rgba(14,15,20,.98)");
    surface.addColorStop(1, "rgba(2,4,8,1)");
    context.fillStyle = surface;
    context.fillRect(-radius, -radius, radius * 2, radius * 2);

    for (let band = -3; band <= 3; band += 1) {
      const ratio = band / 4.15;
      const halfWidth =
        Math.sqrt(Math.max(0, 1 - ratio * ratio)) * radius;
      context.beginPath();
      context.ellipse(
        0,
        ratio * radius,
        halfWidth,
        Math.max(1, halfWidth * .085),
        0,
        0,
        Math.PI * 2
      );
      context.strokeStyle = band === 0
        ? "rgba(255,208,119,.30)"
        : "rgba(255,212,142,.14)";
      context.lineWidth = band === 0 ? 1 : .64;
      context.stroke();
    }

    const drawLink = (from, to) => {
      if (!from || !to || Math.min(from.z, to.z) < -.08) {
        return;
      }

      const depth = (from.z + to.z + 2) / 4;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.strokeStyle =
        "rgba(255,191,84," + (.08 + depth * .20) + ")";
      context.lineWidth = .42 + depth * .35;
      context.stroke();
    };

    for (let row = 0; row < LANGUAGE_LATITUDES; row += 1) {
      for (let column = 0; column < LANGUAGE_LONGITUDES; column += 1) {
        const point = nodeAt(row, column);
        drawLink(point, nodeAt(row, column + 1));

        if (row < LANGUAGE_LATITUDES - 1) {
          drawLink(point, nodeAt(row + 1, column));
        }
      }
    }

    nodes
      .slice()
      .sort((first, second) => first.z - second.z)
      .forEach(point => {
        if (point.z < -.16) {
          return;
        }

        const depth = (point.z + 1) / 2;
        const size = Math.max(
          5,
          Math.round(radius * (.082 + depth * .035))
        );
        context.globalAlpha = .22 + depth * (active ? .74 : .56);
        context.fillStyle = point.z > .56 ? "#fff0c8" : "#f7bf68";
        context.font =
          "800 " +
          size +
          "px ui-monospace, SFMono-Regular, monospace";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(point.glyph, point.x, point.y);

        if (point.z > .42) {
          context.beginPath();
          context.arc(
            point.x,
            point.y + size * .68,
            Math.max(.55, size * .075),
            0,
            Math.PI * 2
          );
          context.fillStyle = "rgba(255,229,173,.84)";
          context.fill();
        }
      });

    const reflection = context.createLinearGradient(0, -radius, 0, radius);
    reflection.addColorStop(0, "rgba(255,250,226,.14)");
    reflection.addColorStop(.42, "rgba(255,222,165,.025)");
    reflection.addColorStop(1, "rgba(0,0,0,.22)");
    context.fillStyle = reflection;
    context.fillRect(-radius, -radius, radius * 2, radius * 2);
    context.restore();

    context.globalAlpha = 1;
    context.beginPath();
    context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    context.strokeStyle = active
      ? "rgba(255,247,215,.98)"
      : "rgba(255,218,143,.78)";
    context.lineWidth = active ? 2 : 1.35;
    context.stroke();

    const signalAngle = surfaceSpin * 1.38;
    const signalX =
      position.x + Math.cos(signalAngle) * radius * 1.23;
    const signalY =
      position.y + Math.sin(signalAngle) * radius * .52;
    context.beginPath();
    context.arc(signalX, signalY, active ? 2.25 : 1.6, 0, Math.PI * 2);
    context.fillStyle = "rgba(214,244,255,.94)";
    context.shadowColor = "rgba(108,198,220,.86)";
    context.shadowBlur = 9;
    context.fill();
    context.shadowColor = "transparent";
    context.shadowBlur = 0;

    context.fillStyle = "#fff0cf";
    drawCipherCoreTitle(
      core.title,
      position.x,
      position.y - 4,
      scale,
      time,
      active,
      core.id
    );

    const stats = getCoreStats(core.id);
    context.fillStyle = "rgba(255,240,210,.78)";
    context.font =
      Math.max(8, Math.round(9 * scale)) + "px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(stats.used + "/70", position.x, position.y + 13);

    context.restore();
    return { position, drawRadius: radius };
  }

  const styles = window.CHT360CoreStyles || Object.create(null);
  styles.earth = drawEarthStyle;
  styles.language = drawLanguageStyle;
  window.CHT360CoreStyles = styles;
})();
