export interface IItem {
  name: string
  price: number
  print: () => void
}

class Item implements IItem {
  constructor(public name: string, public price: number) {}

  print() {
    console.log(this.name, this.price)
  }
}

export function iterate(items: Item[]) {
  items.forEach(item => item.print())
}
