let username = "";

function iniciarApp() {
  const inputName = document.getElementById("username").value.trim();
  if (!inputName) return alert("Por favor, ingresa tu nombre");
  username = inputName;

  document.getElementById("bienvenida").classList.add("hidden");
  document.getElementById("calculadora").classList.remove("hidden");
  document.getElementById("tituloUsuario").innerText = `Hola, ${username}! Calculadora de Calorías`;
  mostrarHistorial();
}

function mostrarSeccion(id) {
  document.querySelectorAll("main > section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  document.querySelector(`.nav-link[data-section='${id}']`).classList.add("active");
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    mostrarSeccion(link.getAttribute("data-section"));
  });
});

function guardarHistorial(datos) {
  const historial = JSON.parse(localStorage.getItem("historialCalorias")) || [];
  historial.unshift({ ...datos, nombre: username });
  localStorage.setItem("historialCalorias", JSON.stringify(historial.slice(0, 10)));
  mostrarHistorial();
}

function mostrarHistorial() {
  const historial = JSON.parse(localStorage.getItem("historialCalorias")) || [];
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";
  historial.forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${entry.nombre}</strong> | ${entry.fecha} — ${entry.calorias} cal | IMC: ${entry.imc} (${entry.imcCategoria})`;
    historyList.appendChild(li);
  });
}

function borrarHistorial() {
  localStorage.removeItem("historialCalorias");
  mostrarHistorial();
}

document.getElementById("goal").addEventListener("change", function () {
  const deficitOptions = document.getElementById("deficitOptions");
  const surplusOptions = document.getElementById("surplusOptions");
  if (this.value === "lose") {
    deficitOptions.classList.remove("hidden");
    surplusOptions.classList.add("hidden");
  } else if (this.value === "gain") {
    surplusOptions.classList.remove("hidden");
    deficitOptions.classList.add("hidden");
  } else {
    deficitOptions.classList.add("hidden");
    surplusOptions.classList.add("hidden");
  }
});

function calcularResultadosExtras(weight, finalCalories, goal, imc, sex, age) {
  const tmbInfo = Math.round(finalCalories / (goal === "maintain" ? 1 : (goal === "gain" ? 1.1 : 0.9)));
  const desayuno = Math.round(finalCalories * 0.25);
  const almuerzo = Math.round(finalCalories * 0.35);
  const cena = Math.round(finalCalories * 0.3);
  const snack = Math.round(finalCalories * 0.1);
  const pasos = goal === "lose" ? 10000 : goal === "gain" ? 6000 : 7000;
  const agua = (weight * 0.035).toFixed(2);
  const grasaAprox = sex === "male"
    ? (1.20 * imc + 0.23 * age - 10.8 - 5.4).toFixed(1)
    : (1.20 * imc + 0.23 * age - 5.4).toFixed(1);
  return { tmbInfo, desayuno, almuerzo, cena, snack, pasos, agua, grasaAprox };
}

document.getElementById("calorieForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const sex = document.getElementById("sex").value;
  const age = parseInt(document.getElementById("age").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const activity = document.getElementById("activity").value;
  const goal = document.getElementById("goal").value;

  if (isNaN(age) || isNaN(weight) || isNaN(height)) {
    alert("Por favor, completa todos los campos correctamente.");
    return;
  }

  const tmb = (sex === "male")
    ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
    : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;

  const activityMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    intense: 1.725,
  };

  let finalCalories = tmb * (activityMap[activity] || 1.2);

  if (goal === "gain") {
    const surplusMap = {
      light: 1.05,
      moderate: 1.1,
      aggressive: 1.15,
      veryAggressive: 1.2,
    };
    const surplus = document.getElementById("surplus")?.value || "moderate";
    finalCalories *= surplusMap[surplus];
  } else if (goal === "lose") {
    const deficitMap = {
      light: 0.95,
      moderate: 0.9,
      aggressive: 0.85,
      veryAggressive: 0.8,
    };
    const deficit = document.getElementById("deficit")?.value || "moderate";
    finalCalories *= deficitMap[deficit];
  }

  const calcularIMC = (peso, altura) => peso / ((altura / 100) ** 2);
  const calcularIMM = (peso, altura) => calcularIMC(peso, altura) * 1.2;

  const imc = calcularIMC(weight, height);
  const imm = calcularIMM(weight, height);

  const categoriaIMC = (imc) => {
    if (imc < 18.5) return "Bajo peso";
    if (imc < 24.9) return "Peso normal";
    if (imc < 29.9) return "Sobrepeso";
    return "Obesidad";
  };

  const imcCategoria = categoriaIMC(imc);
  const { proteinas, carbohidratos, grasas } = {
    gain: { proteinas: weight * 1.6, carbohidratos: weight * 4, grasas: weight * 1 },
    lose: { proteinas: weight * 2.2, carbohidratos: weight * 2, grasas: weight * 0.8 },
    maintain: { proteinas: weight * 1.2, carbohidratos: weight * 3, grasas: weight * 1 }
  }[goal];

  const { ejercicioCardio, ejercicioFuerza } = {
    gain: { ejercicioCardio: "20-30 min, 2-3x/sem", ejercicioFuerza: "45-60 min, 4-5x/sem" },
    lose: { ejercicioCardio: "30-45 min, 4-5x/sem", ejercicioFuerza: "20-30 min, 2-3x/sem" },
    maintain: { ejercicioCardio: "30 min, 3-4x/sem", ejercicioFuerza: "30-45 min, 3-4x/sem" }
  }[goal];

  const extras = calcularResultadosExtras(weight, finalCalories, goal, imc, sex, age);

  document.getElementById("result").innerHTML = `
    <h3>Resultado para ${username}</h3>
    <table>
      <tr><th>Calorías diarias</th><td><strong>${Math.round(finalCalories)} cal</strong></td></tr>
      <tr><th>IMC</th><td>${imc.toFixed(2)} (${imcCategoria})</td></tr>
      <tr><th>IMM</th><td>${imm.toFixed(2)}</td></tr>
    </table>
    <div class="imm-descripcion">Tu Índice de Masa Muscular (IMM), que es de ${imm.toFixed(2)}, indica que tienes una proporción alta de masa magra (músculos) en relación a tu altura y peso. Esto generalmente se considera positivo porque significa que tienes una buena cantidad de músculo en tu cuerpo, lo cual contribuye a tu metabolismo y tu salud en general.</div>

    <h3>Recomendaciones de Alimentación (por día)</h3>
    <table>
      <tr><th>Proteínas</th><td>${proteinas.toFixed(0)} g</td></tr>
      <tr><th>Carbohidratos</th><td>${carbohidratos.toFixed(0)} g</td></tr>
      <tr><th>Grasas</th><td>${grasas.toFixed(0)} g</td></tr>
    </table>

    <h3>Recomendaciones de Ejercicio</h3>
    <table>
      <tr><th>Cardio</th><td>${ejercicioCardio}</td></tr>
      <tr><th>Fuerza</th><td>${ejercicioFuerza}</td></tr>
    </table>

    <h3>Extras Personalizados para ${username}</h3>
    <table>
      <tr><th>Tasa Metabólica Basal (TMB)</th><td>${extras.tmbInfo} cal</td></tr>
      <tr><td colspan="2" style="font-size: 14px; color: #555">La TMB representa la cantidad mínima de calorías que tu cuerpo necesita en reposo absoluto para funcionar correctamente.</td></tr>
      <tr><th>Distribución calórica</th><td>Desayuno: ${extras.desayuno} cal, Almuerzo: ${extras.almuerzo} cal, Cena: ${extras.cena} cal, Snacks: ${extras.snack} cal</td></tr>
      <tr><th>Pasos diarios sugeridos</th><td>${extras.pasos} pasos</td></tr>
      <tr><th>Hidratación recomendada</th><td>${extras.agua} L/día</td></tr>
      <tr><th>% Estimado de grasa corporal</th><td>${extras.grasaAprox}%</td></tr>
      <tr><th>Micronutrientes claves</th><td>Incluye hierro, calcio y vitamina D en tu dieta.</td></tr>
  `;

  guardarHistorial({
    fecha: new Date().toLocaleString(),
    calorias: Math.round(finalCalories),
    imc: imc.toFixed(2),
    imm: imm.toFixed(2),
    imcCategoria,
    proteinas: proteinas.toFixed(0),
    carbohidratos: carbohidratos.toFixed(0),
    grasas: grasas.toFixed(0),
    ejercicioCardio,
    ejercicioFuerza
  });
});
