import _ from 'lodash';
import classNames from 'classnames';
import { Link } from 'react-router';
import React, { createClass, PropTypes } from 'react';
import Logo from '../components/Logo';

const NAV_LINKS = [
  { href: '/', title: 'home' },
  { href: '/portfolio', title: 'portfolio' },
  { href: '/about', title: 'about' }
];

const SOCIAL_LINKS = [
  { href: 'https://twitter.com/beverlymoon', title: 'twitter', src: '/img/twitter.svg' },
  { href: 'https://instagram.com/beverlymoon', title: 'instagram', src: '/img/instagram.svg' },
  { href: 'https://www.facebook.com/beverly.n.moon', title: 'facebook', src: '/img/facebook.svg' },
  { href: 'https://pinterest.com/beverlymoon', title: 'pinterest', src: '/img/pinterest.svg' },
  { href: 'mailto:beverly@beverlymoon.com', title: 'email', src: '/img/email.svg' }
];

// const getClass = pathname => _.reject(pathname.split('/'), _.isEmpty)[0] || '';

const {
  any
} = PropTypes;

const App = createClass({
  render() {
    const { children } = this.props;
    const { isActive } = this.state;
    const navLinks = _.map(NAV_LINKS, ({ href, title }) => <li key={title}><Link to={href} onClick={this.handleNavClick}>{title}</Link></li>);
    return (
      <div id='root' className={classNames({ 'menu-open': isActive })}>
        <nav id='mobile-nav'>
          <ul className='nav-links'>
            {navLinks}
          </ul>
        </nav>
        <nav id='nav'>
          <Link id='logo' to='/'>
            <Logo />
          </Link>
          <ul className='nav-links'>
            {navLinks}
          </ul>
          <button
            id='mobile-nav-button'
            className={classNames({ 'is-active': isActive })}
            onClick={() => this.setState({ isActive: !isActive })}
          >
            <span>toggle menu</span>
          </button>
        </nav>
        {children}
        <footer>
          <ul className='social'>
            {_.map(SOCIAL_LINKS, ({ href, title, src }) => <li className={title} key={title}><a title={title} href={href}><img src={src}/></a></li>)}
          </ul>
          <section className='contact'>
            <p>Copyright &copy; 2016 &bull; Beverly Moon</p>
            <span>
              <address>Portland, Oregon</address>
              &bull; (404) 386 2836
            </span>
          </section>
        </footer>
      </div>
    );
  },
  getInitialState: () => ({ isActive: false }),
  handleNavClick() {
    this.setState({ isActive: false });
  },
  propTypes: {
    children: any
  }
});

export default App;
