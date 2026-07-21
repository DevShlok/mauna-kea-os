import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex text-sm text-gray-500 font-medium" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.label} className="inline-flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
              {item.href && !isLast ? (
                <Link 
                  href={item.href}
                  className="hover:text-[#133255] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-gray-900" : ""}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
