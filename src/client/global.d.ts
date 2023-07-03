declare module '*.module.scss' {
  const styles: { [className: string]: string }
  export default styles
}

declare module '*.svg' {
  export default React.Component
}
