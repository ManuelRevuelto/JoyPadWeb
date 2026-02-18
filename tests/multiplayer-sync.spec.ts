import { test, expect, devices } from '@playwright/test';

test('Should synchronise the movement between the Controller and the Monitor.', async ({ browser }) => {
  // 1. Creamos el contexto del MONITOR (Pantalla grande)
  const monitorContext = await browser.newContext();
  const monitorPage = await monitorContext.newPage();
  await monitorPage.goto('http://localhost:4200/monitor'); // Ajusta a tu ruta

  const roomIdElement = monitorPage.locator('#room-id');
  roomIdElement.waitFor();
  const roomId = await roomIdElement.textContent();
  console.log(`Sala creada: ${roomId}`);

  // 2. Creamos el contexto del MANDO (Simulando un iPhone)
  const remoteContext = await browser.newContext({
    ...devices['iPhone 14'],
  });
  const remotePage = await remoteContext.newPage();
  await remotePage.goto(`http://localhost:4200/remote/${roomId}`);

  // Selector específico para el primer coche que aparezca
  const car = monitorPage.locator('.car').first();
  await expect(car).toBeVisible({ timeout: 10000 });

  const initialStyle = await car.getAttribute('style');

  // SIMULAR MANTENER PULSADO (Nivel Mid: simulación real de eventos)
  const upButton = remotePage.locator('#btn-up');
  await upButton.dispatchEvent('mousedown'); // Activa el movimiento

  // Esperar un poco para que el servidor procese y el coche se mueva
  await monitorPage.waitForTimeout(500);

  await upButton.dispatchEvent('mouseup'); // Detiene el movimiento

  const finalStyle = await car.getAttribute('style');

  console.log(`Posición Inicial: ${initialStyle}`);
  console.log(`Posición Final: ${finalStyle}`);

  expect(initialStyle).not.toBe(finalStyle);
  console.log('✅ Sincronización verificada: El mando movió al coche en el monitor.');
});
