import React from 'react';
import { AUTHORIZE_DATA_LABEL, TERMS_LINK_TEXT } from '../data/legal-copy';

export interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({ checked, onChange, id }) => {
  const [before, after = ''] = AUTHORIZE_DATA_LABEL.split(TERMS_LINK_TEXT);

  return (
    <div className="terminos-checkbox">
      <label className="checkbox-label consent-checkbox" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="consent-checkbox-text">
          {before}
          <a href="/terminos#privacidad" target="_blank" rel="noopener noreferrer">
            {TERMS_LINK_TEXT}
          </a>
          {after}
        </span>
      </label>
    </div>
  );
};

export default ConsentCheckbox;
