export default class RestingBook {
  private el: HTMLElement | null = null;

  public bind = (el: HTMLElement | null) => {
    this.el = el;

    return () => {
      this.el = null;
    };
  };

  public get element() {
    return this.el;
  }

  public get button() {
    return this.el?.querySelector<HTMLElement>('.sketchbook-rest-button') ?? null;
  }

  public get isAway() {
    return this.el?.hasAttribute('data-away') === true;
  }

  public get isRising() {
    const book = this.el?.querySelector('.sketchbook-rest-book');
    const rises = (animation: Animation) =>
      animation instanceof CSSTransition && animation.transitionProperty === 'translate';

    return book?.getAnimations().some(rises) === true;
  }

  public raise() {
    this.el?.setAttribute('data-raised', '');
  }

  public lower() {
    this.el?.removeAttribute('data-raised');
  }

  public leave() {
    this.el?.setAttribute('data-away', '');
  }

  public land() {
    this.el?.removeAttribute('data-away');
    this.lower();
  }
}
