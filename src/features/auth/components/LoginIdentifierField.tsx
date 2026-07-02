import {authInputClassName} from '../constants';
import {FieldLabel} from './FieldLabel';

type LoginIdentifierFieldProps = {
    identifier: string;
    onIdentifierChange: (value: string) => void;
};

export function LoginIdentifierField({identifier, onIdentifierChange}: LoginIdentifierFieldProps) {
    return (
        <div>
            <FieldLabel title="نام کاربری یا ایمیل" required showRequirement={false}/>
            <input
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={identifier}
                onChange={(event) => onIdentifierChange(event.target.value)}
                placeholder="نام کاربری یا ایمیل"
                required
                className={authInputClassName}
            />
        </div>
    );
}
