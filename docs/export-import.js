export function stahnoutJson(data, nazevSouboru) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const odkaz = document.createElement("a");
  odkaz.href = url;
  odkaz.download = nazevSouboru;

  document.body.appendChild(odkaz);
  odkaz.click();
  odkaz.remove();
  URL.revokeObjectURL(url);
}
