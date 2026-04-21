# La Bombonera — Fase 2 Setup

## Lo que hay en esta carpeta

```
bombonera-pwa/
├── public/
│   ├── index.html      <- La app completa
│   ├── manifest.json   <- PWA manifest (icono, nombre, colores)
│   ├── sw.js           <- Service Worker (offline support)
│   └── logo.svg        <- Logo de La Bombonera
├── firebase.json       <- Configuracion de Firebase Hosting
├── .firebaserc         <- ID del proyecto Firebase
└── INSTRUCCIONES.md    <- Este archivo
```

---

## Paso 1: Crear el proyecto Firebase

1. Ir a https://console.firebase.google.com
2. Click en "Agregar proyecto"
3. Nombre: `la-bombonera-guanare`
4. Desactivar Google Analytics (no es necesario)
5. Crear proyecto

---

## Paso 2: Activar Firestore

1. En el menu izquierdo: Build → Firestore Database
2. Click "Crear base de datos"
3. Seleccionar modo **produccion**
4. Ubicacion: `us-central1` (o la mas cercana)
5. Crear

### Reglas de seguridad (pegar en la pestaña "Reglas"):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /negocios/{negocioId}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

> Nota: Para Fase 3 agregaremos autenticacion real. Por ahora esto es suficiente.

---

## Paso 3: Obtener la configuracion de Firebase

1. En Firebase Console → Configuracion del proyecto (icono ⚙)
2. Bajar hasta "Tus apps" → Click en `</>`  (Web)
3. Nombre de la app: `bombonera-web`
4. Activar "Firebase Hosting" ✓
5. Copiar el objeto `firebaseConfig` que aparece

Ejemplo de lo que vas a copiar:
```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "la-bombonera-guanare.firebaseapp.com",
  projectId: "la-bombonera-guanare",
  storageBucket: "la-bombonera-guanare.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

---

## Paso 4: Pegar la config en index.html

Abrir `public/index.html` y buscar esta seccion (cerca del final):

```javascript
var firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  authDomain: "REEMPLAZAR.firebaseapp.com",
  ...
```

Reemplazar con los valores reales del paso anterior.

---

## Paso 5: Instalar Firebase CLI y desplegar

En la computadora (requiere Node.js):

```bash
# Instalar Firebase CLI (una sola vez)
npm install -g firebase-tools

# Login con cuenta Google
firebase login

# Ir a la carpeta del proyecto
cd bombonera-pwa

# Desplegar
firebase deploy
```

Al terminar, Firebase da una URL tipo:
`https://la-bombonera-guanare.web.app`

Esa es la URL que Rafael y Angel abren en Chrome para instalar la PWA.

---

## Paso 6: Instalar como app en Android

1. Rafael abre Chrome y va a la URL
2. Chrome muestra un banner "Agregar a pantalla de inicio"
3. Toca el banner → "Instalar"
4. Aparece el icono de La Bombonera en la pantalla
5. Al abrir, se ve en pantalla completa como una app nativa

Repetir en el telefono de Angel y el ayudante.

---

## Actualizar la app en el futuro

Cuando haya cambios en `index.html`, simplemente:

```bash
firebase deploy
```

Todos los telefonos reciben la actualizacion automaticamente la proxima vez que abren la app con internet.

---

## Plan de datos al arrancar

1. Rafael abre la app nueva
2. Va a Configuracion → carga tasa BCV y Binance
3. Los precios del menu ya estan cargados (menu completo de La Bombonera)
4. Va a Deudas → agrega las deudas historicas una por una con "Deuda antigua"
5. Listo — a partir de ese momento todo queda en Firebase

