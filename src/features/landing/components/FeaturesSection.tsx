import {features} from '../constants';
import {IconBadge} from './IconBadge';

export function FeaturesSection() {
    return (
        <section id="features" className="landing-section py-20 sm:py-24">
            <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
                <div className="max-w-2xl">
                    <span className="text-sm font-black text-[#00E5C9]">امکانات کلیدی</span>
                    <h2 className="mt-3 text-3xl font-black leading-[1.45] text-white sm:text-4xl">
                        ابزارهایی که معامله‌گر را برای بازار واقعی آماده می‌کنند
                    </h2>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {features.map((feature) => (
                        <article key={feature.title} className="landing-feature-card">
                            <IconBadge icon={feature.icon} accent={feature.accent}/>
                            <h3 className="mt-5 text-lg font-black leading-8 text-white">{feature.title}</h3>
                            <p className="mt-3 text-sm font-medium leading-7 text-[#AFC1D8]">{feature.description}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
