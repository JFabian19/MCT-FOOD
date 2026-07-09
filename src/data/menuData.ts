export interface Addon {
  nombre: string;
  precio: number;
}

export interface Dish {
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio: string;
  adicionales?: Addon[];
  opciones?: string[]; // e.g. ["Pecho", "Muslo"]
  acompanamiento?: string;
}

export interface Category {
  id: string;
  nombre: string;
  items: Dish[];
}

export const DEFAULT_MENU_DATA: Category[] = [
  {
    id: "menu-del-dia",
    nombre: "Menú del Día",
    items: [
      {
        nombre: "Menú del Día (Lunes 6 de Julio)",
        descripcion: "Entrada: Ensalada de palta | Sopa: Sopa de casa | Fondo: Lentejas con pollo a la olla | Refresco: Refresco de yervita muña",
        precio: "S/. 10.00"
      }
    ]
  },
  {
    id: "desayuno",
    nombre: "Desayuno",
    items: [
      {
        nombre: "Caldo de gallina",
        descripcion: "Caldo de gallina tradicional, concentrado y reponedor.",
        imagen: "/caldo_de_gallina.jpg",
        precio: "S/. 12.00"
      }
    ]
  },
  {
    id: "platos-a-la-carta",
    nombre: "Platos a la Carta",
    items: [
      {
        nombre: "Bistec",
        descripcion: "Jugoso bistec acompañado de arroz, papas fritas y ensalada fresca.",
        imagen: "/bistec.png",
        precio: "S/. 12.00"
      },
      {
        nombre: "Pollo a la plancha",
        descripcion: "Pechuga de pollo tierna a la plancha, arroz y ensalada.",
        imagen: "/pollo_a_la_plancha.jpg",
        precio: "S/. 12.00"
      },
      {
        nombre: "Chuleta",
        descripcion: "Chuleta de cerdo bien sazonada, arroz y papas fritas.",
        imagen: "/chuleta.png",
        precio: "S/. 12.00"
      },
      {
        nombre: "Pollada",
        descripcion: "Pollada crocante con su clásica ensalada y papas doradas.",
        imagen: "/pollada.jpg",
        precio: "S/. 20.00"
      },
      {
        nombre: "Lomo saltado",
        descripcion: "Clásico lomo saltado al wok con cebolla, tomate, papas fritas y arroz.",
        imagen: "/lomo_saltado.jpg",
        precio: "S/. 12.00"
      }
    ]
  },
  {
    id: "otros-platos",
    nombre: "Otros Platos / Fast Food",
    items: [
      {
        nombre: "Hamburguesa artesanal",
        descripcion: "Hamburguesa casera premium, lechuga y tomate en pan brioche.",
        imagen: "/hamburguesa_artesanal.jpg",
        precio: "S/. 8.00",
        adicionales: [
          { nombre: "Papas al hilo", precio: 6.00 }
        ]
      },
      {
        nombre: "Chorizo artesanal",
        descripcion: "Chorizo de la casa a la parrilla con chimichurri.",
        imagen: "/chorizo_artesanal.jpg",
        precio: "S/. 8.00",
        adicionales: [
          { nombre: "Papas al hilo", precio: 6.00 }
        ]
      },
      {
        nombre: "Broster",
        descripcion: "Pollo broster crujiente, papas fritas y cremas.",
        imagen: "/broster.jpg",
        precio: "S/. 10.00",
        opciones: ["Pecho", "Muslo"]
      },
      {
        nombre: "Patitas broster",
        descripcion: "Patitas de pollo sazonadas estilo broster con papas fritas.",
        imagen: "/patitas_broster.jpg",
        precio: "S/. 5.00",
        acompanamiento: "Papas fritas"
      },
      {
        nombre: "Cuellito broster",
        descripcion: "Cuellito broster crujiente con papas fritas.",
        imagen: "/cuellito_broster.jpg",
        precio: "S/. 5.00",
        acompanamiento: "Papas fritas"
      }
    ]
  },
  {
    id: "bebidas",
    nombre: "Bebidas",
    items: [
      {
        nombre: "Gaseosas",
        descripcion: "Variedad de gaseosas heladas.",
        precio: "S/. 3.00"
      },
      {
        nombre: "Aguas",
        descripcion: "Agua mineral con o sin gas.",
        precio: "S/. 2.00"
      },
      {
        nombre: "Espore",
        descripcion: "Bebida rehidratante Sporade / Gatorade.",
        precio: "S/. 4.00"
      },
      {
        nombre: "Chicha (Botella de 330 ml)",
        descripcion: "Chicha morada natural embotellada de la casa.",
        precio: "S/. 1.50"
      },
      {
        nombre: "Maracuyá (Botella de 330 ml)",
        descripcion: "Jugo de maracuyá refrescante embotellado de la casa.",
        precio: "S/. 1.50"
      }
    ]
  }
];
